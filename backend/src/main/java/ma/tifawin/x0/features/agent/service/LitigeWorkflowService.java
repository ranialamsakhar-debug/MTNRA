package ma.tifawin.x0.features.agent.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.common.enums.DossierStatut;
import ma.tifawin.x0.common.enums.LitigeStatut;
import ma.tifawin.x0.common.enums.NotificationCanal;
import ma.tifawin.x0.common.enums.TypeAction;
import ma.tifawin.x0.modules.core.entity.*;
import ma.tifawin.x0.modules.core.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LitigeWorkflowService {

    private final LitigeRepository litigeRepository;
    private final DossierRepository dossierRepository;
    private final CitoyenRepository citoyenRepository;
    private final MediateurRepository mediateurRepository;
    private final ResponsableServiceRepository responsableServiceRepository;
    private final HistoriqueActionRepository historiqueActionRepository;
    private final NotificationRepository notificationRepository;

    // ──────────────────────────────────────────────
    //  Étape 1 : Le citoyen saisit le médiateur
    //  (après rejet de son dossier)
    // ──────────────────────────────────────────────

    @Transactional
    public Litige saisirMediateur(Long dossierId, Long citoyenId, String motif, String description) {
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new RuntimeException("Dossier introuvable"));

        if (dossier.getStatut() != DossierStatut.REJETE) {
            throw new IllegalStateException(
                    "Le dossier doit être en statut REJETE pour saisir le médiateur. Statut actuel : " + dossier.getStatut());
        }

        Citoyen citoyen = citoyenRepository.findById(citoyenId)
                .orElseThrow(() -> new RuntimeException("Citoyen introuvable"));

        // Vérifier que le citoyen est bien le propriétaire du dossier
        if (!dossier.getCitoyen().getId().equals(citoyen.getId())) {
            throw new IllegalStateException("Le citoyen n'est pas le propriétaire de ce dossier");
        }

        // Créer le litige
        Litige litige = new Litige();
        litige.setNumeroLitige(genererNumeroLitige());
        litige.setDossier(dossier);
        litige.setCitoyen(citoyen);
        litige.setMotif(motif);
        litige.setDescription(description);
        litige.setDateSaisine(LocalDateTime.now());
        litige.setStatut(LitigeStatut.SOUMIS);

        // Mettre le dossier en statut EN_LITIGE
        dossier.setStatut(DossierStatut.EN_LITIGE);
        dossierRepository.save(dossier);

        // Enregistrer dans l'historique
        enregistrerHistorique(dossier, citoyen, TypeAction.SAISINE_MEDIATEUR,
                "Le citoyen a saisi le médiateur. Motif : " + motif);

        String informationsDemande = "Nouvelle saisine médiateur pour le dossier " + dossier.getNumeroDossier()
                + ". Citoyen : " + citoyen.getNom() + " " + citoyen.getPrenom()
                + ". Motif : " + motif + ". Description : "
                + (description != null ? description : "Non fournie");
        responsableServiceRepository.findAll().forEach(responsable ->
                creerNotification(responsable, dossier, informationsDemande));

        return litigeRepository.save(litige);
    }

    // ──────────────────────────────────────────────
    //  Étape 2 : Le médiateur prend en charge le litige
    // ──────────────────────────────────────────────

    @Transactional
    public Litige instruireLitige(Long litigeId, Long mediateurId) {
        Litige litige = chargerLitige(litigeId);
        verifierStatutLitige(litige, LitigeStatut.SOUMIS);

        Mediateur mediateur = mediateurRepository.findById(mediateurId)
                .orElseThrow(() -> new RuntimeException("Médiateur introuvable"));

        litige.setMediateur(mediateur);
        litige.setStatut(LitigeStatut.EN_INSTRUCTION);

        enregistrerHistorique(litige.getDossier(), mediateur, TypeAction.SAISINE_MEDIATEUR,
                "Le médiateur " + mediateur.getNom() + " " + mediateur.getPrenom()
                        + " prend en charge l'instruction du litige " + litige.getNumeroLitige());

        creerNotification(mediateur, litige.getDossier(),
                "Informations transmises par le responsable concernant le dossier "
                        + litige.getDossier().getNumeroDossier() + " : " + litige.getDescription());

        // Notifier le citoyen que son litige est pris en charge
        creerNotification(litige.getCitoyen(), litige.getDossier(),
                "Votre litige " + litige.getNumeroLitige() + " est pris en charge par le médiateur.");

        return litigeRepository.save(litige);
    }

    // ──────────────────────────────────────────────
    //  Étape 3 : Le médiateur émet sa recommandation
    // ──────────────────────────────────────────────

    @Transactional
    public Litige emettreRecommandation(Long litigeId, String recommandation) {
        Litige litige = chargerLitige(litigeId);
        verifierStatutLitige(litige, LitigeStatut.EN_INSTRUCTION);

        litige.setRecommandation(recommandation);
        litige.setDateRecommandation(LocalDateTime.now());
        litige.setStatut(LitigeStatut.RECOMMANDE);

        enregistrerHistorique(litige.getDossier(), litige.getMediateur(), TypeAction.RECOMMANDATION,
                "Recommandation émise par le médiateur : " + recommandation);

        // Notifier le citoyen
        creerNotification(litige.getCitoyen(), litige.getDossier(),
                "Le médiateur a émis une recommandation pour votre litige " + litige.getNumeroLitige() + ".");

        return litigeRepository.save(litige);
    }

    // ──────────────────────────────────────────────
    //  Étape 4a : Le Responsable de Service applique
    //  la recommandation → Clôture du dossier
    // ──────────────────────────────────────────────

    @Transactional
    public Litige appliquerRecommandation(Long litigeId, Long responsableId) {
        Litige litige = chargerLitige(litigeId);
        verifierStatutLitige(litige, LitigeStatut.RECOMMANDE);

        ResponsableService responsable = responsableServiceRepository.findById(responsableId)
                .orElseThrow(() -> new RuntimeException("Responsable de service introuvable"));

        // Mettre à jour le litige
        litige.setStatut(LitigeStatut.MIS_EN_OEUVRE);
        litige.setDateMiseEnOeuvre(LocalDateTime.now());

        // Clôturer le dossier
        Dossier dossier = litige.getDossier();
        dossier.setStatut(DossierStatut.CLOTURE);
        dossier.setDateCloture(LocalDateTime.now());
        dossierRepository.save(dossier);

        enregistrerHistorique(dossier, responsable, TypeAction.CLOTURE,
                "Le responsable de service a appliqué la recommandation du médiateur. "
                        + "Dossier clôturé suite au règlement du litige " + litige.getNumeroLitige());

        // Notifier le citoyen de la clôture
        creerNotification(litige.getCitoyen(), dossier,
                "Bonne nouvelle ! Suite à la recommandation du médiateur, votre dossier "
                        + dossier.getNumeroDossier() + " a été clôturé favorablement.");

        return litigeRepository.save(litige);
    }

    // ──────────────────────────────────────────────
    //  Étape 4b : Le Responsable de Service refuse
    //  → Rejet définitif du dossier
    // ──────────────────────────────────────────────

    @Transactional
    public Litige rejeterDefinitivement(Long litigeId, Long responsableId, String motif) {
        Litige litige = chargerLitige(litigeId);
        verifierStatutLitige(litige, LitigeStatut.RECOMMANDE);

        ResponsableService responsable = responsableServiceRepository.findById(responsableId)
                .orElseThrow(() -> new RuntimeException("Responsable de service introuvable"));

        // Clore le litige
        litige.setStatut(LitigeStatut.CLOS);

        // Rejeter définitivement le dossier
        Dossier dossier = litige.getDossier();
        dossier.setStatut(DossierStatut.REJETE_DEFINITIF);
        dossier.setDateCloture(LocalDateTime.now());
        dossierRepository.save(dossier);

        enregistrerHistorique(dossier, responsable, TypeAction.REJET,
                "Le responsable de service a confirmé le rejet malgré la recommandation du médiateur. "
                        + "Motif : " + (motif != null ? motif : "Non spécifié")
                        + ". Litige " + litige.getNumeroLitige() + " clos.");

        // Notifier le citoyen du rejet définitif
        creerNotification(litige.getCitoyen(), dossier,
                "Votre dossier " + dossier.getNumeroDossier()
                        + " a été rejeté définitivement suite à la décision du responsable de service. "
                        + "Motif : " + (motif != null ? motif : "Non spécifié"));

        return litigeRepository.save(litige);
    }

    // ══════════════════════════════════════════════
    //  Méthodes utilitaires
    // ══════════════════════════════════════════════

    private Litige chargerLitige(Long litigeId) {
        return litigeRepository.findById(litigeId)
                .orElseThrow(() -> new RuntimeException("Litige introuvable avec l'ID : " + litigeId));
    }

    private void verifierStatutLitige(Litige litige, LitigeStatut statutAttendu) {
        if (litige.getStatut() != statutAttendu) {
            throw new IllegalStateException(
                    "Opération impossible : le litige est en statut '" + litige.getStatut()
                            + "' mais le statut attendu est '" + statutAttendu + "'");
        }
    }

    private void enregistrerHistorique(Dossier dossier, Utilisateur acteur, TypeAction typeAction, String details) {
        HistoriqueAction historique = new HistoriqueAction();
        historique.setDossier(dossier);
        historique.setUtilisateur(acteur);
        historique.setTypeAction(typeAction);
        historique.setDateHeure(LocalDateTime.now());
        historique.setDetails(details);
        historiqueActionRepository.save(historique);
    }

    private void creerNotification(Utilisateur destinataire, Dossier dossier, String contenu) {
        Notification notification = new Notification();
        notification.setContenu(contenu);
        notification.setDateEnvoi(LocalDateTime.now());
        notification.setCanal(NotificationCanal.EMAIL);
        notification.setDestinataire(destinataire);
        notification.setDossier(dossier);
        notificationRepository.save(notification);
    }

    private String genererNumeroLitige() {
        String annee = String.valueOf(LocalDateTime.now().getYear());
        long count = litigeRepository.count() + 1;
        return "LIT-" + annee + "-" + String.format("%05d", count);
    }
}
