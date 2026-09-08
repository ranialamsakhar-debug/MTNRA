package ma.tifawin.x0.features.agent.service;

import java.time.LocalDateTime;
import java.util.List;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.common.enums.DossierStatut;
import ma.tifawin.x0.common.enums.TypeAction;
import ma.tifawin.x0.modules.core.entity.*;
import ma.tifawin.x0.modules.core.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AgentWorkflowService {

    private final DossierRepository dossierRepository;
    private final AgentReclamationRepository agentReclamationRepository;
    private final AgentValidationRepository agentValidationRepository;
    private final AgentCertificationRepository agentCertificationRepository;
    private final AgentSignatureRepository agentSignatureRepository;
    private final HistoriqueActionRepository historiqueActionRepository;
    private final NotificationRepository notificationRepository;

    // ──────────────────────────────────────────────
    //  Étape 1 : Assigner un Agent de Réclamation
    // ──────────────────────────────────────────────

    @Transactional
    public Dossier assignerAgentReclamation(Long dossierId, Long agentId) {
        Dossier dossier = chargerDossier(dossierId);
        verifierStatut(dossier, DossierStatut.SOUMIS);

        AgentReclamation agent = agentReclamationRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent de réclamation introuvable"));

        dossier.setAgentReclamation(agent);
        dossier.setStatut(DossierStatut.EN_TRAITEMENT);

        enregistrerHistorique(dossier, agent, TypeAction.CREATION,
                "Dossier assigné à l'agent de réclamation " + agent.getNom() + " " + agent.getPrenom());

        return dossierRepository.save(dossier);
    }

    // ──────────────────────────────────────────────
    //  Étape 2 : Transférer à l'Agent de Validation
    // ──────────────────────────────────────────────

    @Transactional
    public Dossier transfererAValidation(Long dossierId, Long agentValidationId, String commentaire) {
        Dossier dossier = chargerDossier(dossierId);
        verifierStatut(dossier, DossierStatut.EN_TRAITEMENT);

        AgentValidation agent = agentValidationRepository.findById(agentValidationId)
                .orElseThrow(() -> new RuntimeException("Agent de validation introuvable"));

        dossier.setAgentValidation(agent);
        dossier.setStatut(DossierStatut.EN_VALIDATION);

        enregistrerHistorique(dossier, dossier.getAgentReclamation(), TypeAction.TRANSMISSION,
                "Transféré à l'agent de validation. " + (commentaire != null ? commentaire : ""));

        return dossierRepository.save(dossier);
    }

    // ──────────────────────────────────────────────
    //  Étape 3 : Transférer à l'Agent de Certification
    // ──────────────────────────────────────────────

    @Transactional
    public Dossier transfererACertification(Long dossierId, Long agentCertificationId, String commentaire) {
        Dossier dossier = chargerDossier(dossierId);
        verifierStatut(dossier, DossierStatut.EN_VALIDATION);

        AgentCertification agent = agentCertificationRepository.findById(agentCertificationId)
                .orElseThrow(() -> new RuntimeException("Agent de certification introuvable"));

        dossier.setAgentCertification(agent);
        dossier.setStatut(DossierStatut.EN_CERTIFICATION);

        enregistrerHistorique(dossier, dossier.getAgentValidation(), TypeAction.CERTIFICATION,
                "Transféré à l'agent de certification. " + (commentaire != null ? commentaire : ""));

        return dossierRepository.save(dossier);
    }

    // ──────────────────────────────────────────────
    //  Étape 4 : Transférer à l'Agent de Signature
    // ──────────────────────────────────────────────

    @Transactional
    public Dossier transfererASignature(Long dossierId, Long agentSignatureId, String commentaire) {
        Dossier dossier = chargerDossier(dossierId);
        verifierStatut(dossier, DossierStatut.EN_CERTIFICATION);

        AgentSignature agent = agentSignatureRepository.findById(agentSignatureId)
                .orElseThrow(() -> new RuntimeException("Agent de signature introuvable"));

        dossier.setAgentSignature(agent);
        dossier.setStatut(DossierStatut.EN_SIGNATURE);

        enregistrerHistorique(dossier, dossier.getAgentCertification(), TypeAction.SIGNATURE,
                "Transféré à l'agent de signature. " + (commentaire != null ? commentaire : ""));

        return dossierRepository.save(dossier);
    }

    // ──────────────────────────────────────────────
    //  Étape 5 : Clôturer le dossier
    // ──────────────────────────────────────────────

    @Transactional
    public Dossier cloturerDossier(Long dossierId, String commentaire) {
        Dossier dossier = chargerDossier(dossierId);
        verifierStatut(dossier, DossierStatut.EN_SIGNATURE);

        dossier.setStatut(DossierStatut.CLOTURE);
        dossier.setDateCloture(LocalDateTime.now());

        enregistrerHistorique(dossier, dossier.getAgentSignature(), TypeAction.CLOTURE,
                "Dossier signé et clôturé. " + (commentaire != null ? commentaire : ""));

        return dossierRepository.save(dossier);
    }

    // ──────────────────────────────────────────────
    //  Rejet du dossier (depuis n'importe quelle étape de traitement)
    // ──────────────────────────────────────────────

    private static final List<DossierStatut> STATUTS_REJETABLES = List.of(
            DossierStatut.EN_TRAITEMENT,
            DossierStatut.EN_VALIDATION,
            DossierStatut.EN_CERTIFICATION
    );

    @Transactional
    public Dossier rejeterDossier(Long dossierId, Long agentId, String motif) {
        Dossier dossier = chargerDossier(dossierId);

        if (!STATUTS_REJETABLES.contains(dossier.getStatut())) {
            throw new IllegalStateException(
                    "Le dossier ne peut être rejeté que depuis les statuts : " + STATUTS_REJETABLES
                            + ". Statut actuel : " + dossier.getStatut());
        }

        dossier.setStatut(DossierStatut.REJETE);

        // On cherche l'agent qui rejette (peut être n'importe quel type d'agent)
        Utilisateur agent = findAgent(agentId);

        enregistrerHistorique(dossier, agent, TypeAction.REJET,
                "Dossier rejeté. Motif : " + (motif != null ? motif : "Non spécifié"));

        return dossierRepository.save(dossier);
    }

    // ──────────────────────────────────────────────
    //  Demander des compléments au citoyen
    // ──────────────────────────────────────────────

    @Transactional
    public Dossier demanderComplementsAuCitoyen(Long dossierId, String message) {
        Dossier dossier = chargerDossier(dossierId);

        // Créer une notification pour le citoyen
        Notification notification = new Notification();
        notification.setContenu("Demande de compléments pour le dossier " + dossier.getNumeroDossier() + " : " + message);
        notification.setDateEnvoi(LocalDateTime.now());
        notification.setCanal(ma.tifawin.x0.common.enums.NotificationCanal.EMAIL);
        notification.setDestinataire(dossier.getCitoyen());
        notification.setDossier(dossier);
        notificationRepository.save(notification);

        return dossier;
    }

    // ══════════════════════════════════════════════
    //  Méthodes utilitaires
    // ══════════════════════════════════════════════

    private Dossier chargerDossier(Long dossierId) {
        return dossierRepository.findById(dossierId)
                .orElseThrow(() -> new RuntimeException("Dossier introuvable avec l'ID : " + dossierId));
    }

    private void verifierStatut(Dossier dossier, DossierStatut statutAttendu) {
        if (dossier.getStatut() != statutAttendu) {
            throw new IllegalStateException(
                    "Opération impossible : le dossier est en statut '" + dossier.getStatut()
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

    private Utilisateur findAgent(Long agentId) {
        // Chercher dans tous les types d'agents
        return agentReclamationRepository.findById(agentId).map(a -> (Utilisateur) a)
                .or(() -> agentValidationRepository.findById(agentId).map(a -> (Utilisateur) a))
                .or(() -> agentCertificationRepository.findById(agentId).map(a -> (Utilisateur) a))
                .or(() -> agentSignatureRepository.findById(agentId).map(a -> (Utilisateur) a))
                .orElseThrow(() -> new RuntimeException("Agent introuvable avec l'ID : " + agentId));
    }
}
