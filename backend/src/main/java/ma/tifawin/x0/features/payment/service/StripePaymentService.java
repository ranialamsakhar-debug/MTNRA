package ma.tifawin.x0.features.payment.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.tifawin.x0.common.enums.DossierStatut;
import ma.tifawin.x0.common.enums.PaiementStatut;
import ma.tifawin.x0.common.enums.TypeAction;
import ma.tifawin.x0.features.payment.dto.PaymentConfirmationRequest;
import ma.tifawin.x0.features.payment.dto.TarifDemandeDto;
import ma.tifawin.x0.modules.core.entity.*;
import ma.tifawin.x0.modules.core.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StripePaymentService {

    private final PaiementRepository paiementRepository;
    private final DossierRepository dossierRepository;
    private final CitoyenRepository citoyenRepository;
    private final HistoriqueActionRepository historiqueActionRepository;

    @Value("${stripe.api.key:sk_test_mock_secret_key_mtnra}")
    private String stripeApiKey;

    @Value("${stripe.public.key:pk_test_mock_public_key_mtnra}")
    private String stripePublicKey;

    @PostConstruct
    public void init() {
        Stripe.apiKey = stripeApiKey;
        log.info("💳 Service Stripe initialisé pour les paiements administratifs MTNRA.");
    }

    // ── 1. Catalogue des Tarifs Officiels ────────────────

    private static final Map<String, TarifDemandeDto> GRILLE_TARIF_MAP = new LinkedHashMap<>();

    static {
        // Démarches nécessitant des frais administratifs légaux
        GRILLE_TARIF_MAP.put(
                "RC_FONDS_COMMERCE",
                new TarifDemandeDto(
                        "RC_FONDS_COMMERCE",
                        "Immatriculation & Dépôt de Fonds de Commerce",
                        new BigDecimal("200.00"),
                        "MAD",
                        true,
                        "48 heures",
                        "Frais d'enregistrement au Registre du Commerce et certificat de conformité"));

        GRILLE_TARIF_MAP.put(
                "CERTIFICAT_ADMIN",
                new TarifDemandeDto(
                        "CERTIFICAT_ADMIN",
                        "Délivrance de Certificat Administratif Spécial",
                        new BigDecimal("50.00"),
                        "MAD",
                        true,
                        "24 heures",
                        "Timbre fiscal et droits de chancellerie pour attestation certifiée"));

        GRILLE_TARIF_MAP.put(
                "ATTESTATION_FISCALE",
                new TarifDemandeDto(
                        "ATTESTATION_FISCALE",
                        "Attestation Fiscale & Quittance Officielle",
                        new BigDecimal("100.00"),
                        "MAD",
                        true,
                        "24 heures",
                        "Droits de délivrance de quittance fiscale et régularité"));

        GRILLE_TARIF_MAP.put(
                "DUPLICATA_DOCUMENT",
                new TarifDemandeDto(
                        "DUPLICATA_DOCUMENT",
                        "Duplicata Officiel & Copie Conforme Numérique",
                        new BigDecimal("40.00"),
                        "MAD",
                        true,
                        "24 heures",
                        "Frais de traitement et certification de copie"));

        // Réclamations simples (GRATUITES - 0 MAD pour la majorité des citoyens)
        GRILLE_TARIF_MAP.put(
                "RECLAMATION_STANDARD",
                new TarifDemandeDto(
                        "RECLAMATION_STANDARD",
                        "Réclamation Administrative Générale",
                        BigDecimal.ZERO,
                        "MAD",
                        false,
                        "7 jours",
                        "Service public 100% gratuit garanti par l'État"));

        GRILLE_TARIF_MAP.put(
                "RECLAMATION_VOIRIE",
                new TarifDemandeDto(
                        "RECLAMATION_VOIRIE",
                        "Réclamation Voirie & Services Urbains",
                        BigDecimal.ZERO,
                        "MAD",
                        false,
                        "5 jours",
                        "Service public 100% gratuit"));

        GRILLE_TARIF_MAP.put(
                "RECLAMATION_SANTE",
                new TarifDemandeDto(
                        "RECLAMATION_SANTE",
                        "Réclamation Établissement de Santé",
                        BigDecimal.ZERO,
                        "MAD",
                        false,
                        "48 heures",
                        "Service public 100% gratuit"));

        GRILLE_TARIF_MAP.put(
                "SAISINE_MEDIATEUR",
                new TarifDemandeDto(
                        "SAISINE_MEDIATEUR",
                        "Saisine de l'Institution du Médiateur",
                        BigDecimal.ZERO,
                        "MAD",
                        false,
                        "15 jours",
                        "Recours gracieux et médiation 100% gratuit pour le citoyen"));
    }

    public List<TarifDemandeDto> getCatalogueTarifs() {
        return new ArrayList<>(GRILLE_TARIF_MAP.values());
    }

    public TarifDemandeDto getTarif(String code) {
        if (code != null && GRILLE_TARIF_MAP.containsKey(code)) {
            return GRILLE_TARIF_MAP.get(code);
        }
        // Par défaut, toute réclamation non listée est GRATUITE
        return new TarifDemandeDto(
                code != null ? code : "RECLAMATION_STANDARD",
                "Réclamation Citoyenne",
                BigDecimal.ZERO,
                "MAD",
                false,
                "7 jours",
                "Service public gratuit");
    }

    // ── 2. Création de l'Intention de Paiement Stripe ───

    @Transactional
    public Map<String, Object> initialiserPaiement(Long dossierId, String typeCode, String citoyenCin) {
        Dossier dossier = dossierRepository.findById(dossierId)
                .orElseThrow(() -> new RuntimeException("Dossier introuvable : " + dossierId));

        Citoyen citoyen = citoyenRepository.findByCin(citoyenCin)
                .orElse(dossier.getCitoyen());

        TarifDemandeDto tarif = getTarif(typeCode);
        Map<String, Object> response = new HashMap<>();

        // CAS A : Démarche 100% GRATUITE
        if (!tarif.isEstPayant() || tarif.getMontant().compareTo(BigDecimal.ZERO) == 0) {
            Paiement paiement = paiementRepository.findByDossier(dossier).orElseGet(Paiement::new);
            paiement.setDossier(dossier);
            paiement.setCitoyen(citoyen);
            paiement.setNumeroTransaction(genererNumeroTransaction("GRATUIT"));
            paiement.setMontant(BigDecimal.ZERO);
            paiement.setDevise("MAD");
            paiement.setStatut(PaiementStatut.GRATUIT_EXONERE);
            paiement.setMoyenPaiement("GRATUIT_EXONERE");
            paiement.setDatePaiement(LocalDateTime.now());
            paiementRepository.save(paiement);

            dossier.setStatut(DossierStatut.SOUMIS);
            dossierRepository.save(dossier);

            response.put("estPayant", false);
            response.put("statut", "GRATUIT_EXONERE");
            response.put("message", "Cette démarche est un service public gratuit. Aucun paiement requis.");
            response.put("numeroTransaction", paiement.getNumeroTransaction());
            return response;
        }

        // CAS B : Démarche PAYANTE -> Initialisation Stripe
        long montantCentimes = tarif.getMontant().multiply(new BigDecimal(100)).longValue();
        String clientSecret = "mock_cs_" + UUID.randomUUID().toString();
        String paymentIntentId = "pi_" + UUID.randomUUID().toString().substring(0, 16);

        // Tentative de création d'un vrai PaymentIntent Stripe si la clé est valide
        if (stripeApiKey != null && stripeApiKey.startsWith("sk_")) {
            try {
                PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                        .setAmount(montantCentimes)
                        .setCurrency("mad")
                        .setDescription("Frais administratifs MTNRA - " + tarif.getLibelle())
                        .putMetadata("dossierId", dossier.getIdDossier().toString())
                        .putMetadata("numeroDossier", dossier.getNumeroDossier())
                        .putMetadata("citoyenCin", citoyen.getCin())
                        .setAutomaticPaymentMethods(
                                PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build())
                        .build();

                PaymentIntent intent = PaymentIntent.create(params);
                clientSecret = intent.getClientSecret();
                paymentIntentId = intent.getId();
                log.info("✅ PaymentIntent Stripe créé avec succès : {}", paymentIntentId);
            } catch (Exception e) {
                log.warn("⚠️ Mode simulation Stripe actif ({})", e.getMessage());
            }
        }

        // Enregistrer le paiement en attente
        Paiement paiement = paiementRepository.findByDossier(dossier).orElseGet(Paiement::new);
        paiement.setDossier(dossier);
        paiement.setCitoyen(citoyen);
        paiement.setNumeroTransaction(genererNumeroTransaction("STRIPE"));
        paiement.setMontant(tarif.getMontant());
        paiement.setDevise(tarif.getDevise());
        paiement.setStatut(PaiementStatut.EN_ATTENTE_PAIEMENT);
        paiement.setMoyenPaiement("STRIPE_CARD");
        paiement.setStripePaymentIntentId(paymentIntentId);
        paiementRepository.save(paiement);

        response.put("estPayant", true);
        response.put("statut", "EN_ATTENTE_PAIEMENT");
        response.put("montant", tarif.getMontant());
        response.put("devise", tarif.getDevise());
        response.put("clientSecret", clientSecret);
        response.put("paymentIntentId", paymentIntentId);
        response.put("stripePublicKey", stripePublicKey);
        response.put("numeroTransaction", paiement.getNumeroTransaction());
        response.put("libelleDemande", tarif.getLibelle());

        return response;
    }

    // ── 3. Confirmation du Paiement et Émission du Reçu ─

    @Transactional
    public Paiement confirmerPaiement(PaymentConfirmationRequest request) {
        Dossier dossier = dossierRepository.findById(request.getDossierId())
                .orElseThrow(() -> new RuntimeException("Dossier introuvable : " + request.getDossierId()));

        Paiement paiement = paiementRepository.findByDossier(dossier)
                .orElseThrow(() -> new RuntimeException("Paiement introuvable pour ce dossier"));

        paiement.setStatut(PaiementStatut.PAYE);
        paiement.setDatePaiement(LocalDateTime.now());
        paiement.setMoyenPaiement(request.getMoyenPaiement() != null ? request.getMoyenPaiement() : "STRIPE_CARD");
        paiement.setCarteLast4(request.getCarteLast4() != null ? request.getCarteLast4() : "4242");
        paiement.setCarteMarque(request.getCarteMarque() != null ? request.getCarteMarque() : "Visa");
        paiement.setRecuUrl("/quittances/" + paiement.getNumeroTransaction() + ".pdf");

        paiementRepository.save(paiement);

        // Passer le dossier en statut SOUMIS (prêt pour traitement agent)
        dossier.setStatut(DossierStatut.SOUMIS);
        dossierRepository.save(dossier);

        // Enregistrer dans l'audit trail
        HistoriqueAction action = new HistoriqueAction();
        action.setDossier(dossier);
        action.setUtilisateur(dossier.getCitoyen());
        action.setTypeAction(TypeAction.CREATION);
        action.setDateHeure(LocalDateTime.now());
        action.setDetails("Paiement des frais administratifs validé avec succès ("
                + paiement.getMontant() + " " + paiement.getDevise()
                + " via " + paiement.getMoyenPaiement() + "). N° Transaction : " + paiement.getNumeroTransaction());
        historiqueActionRepository.save(action);

        log.info("🎉 Paiement confirmé avec succès pour le dossier {} (Montant: {} {})",
                dossier.getNumeroDossier(), paiement.getMontant(), paiement.getDevise());

        return paiement;
    }

    public Optional<Paiement> getPaiement(Long dossierId) {
        Dossier dossier = dossierRepository.findById(dossierId).orElse(null);
        return dossier != null ? paiementRepository.findByDossier(dossier) : Optional.empty();
    }

    private String genererNumeroTransaction(String prefix) {
        String annee = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now());
        String rand = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        return "PAY-" + prefix + "-" + annee + "-" + rand;
    }
}
