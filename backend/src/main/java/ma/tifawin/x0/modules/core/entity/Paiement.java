package ma.tifawin.x0.modules.core.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.tifawin.x0.common.enums.PaiementStatut;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "paiements")
public class Paiement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPaiement;

    @Column(nullable = false, unique = true)
    private String numeroTransaction;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal montant = BigDecimal.ZERO;

    @Column(nullable = false, length = 10)
    private String devise = "MAD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaiementStatut statut = PaiementStatut.GRATUIT_EXONERE;

    @Column(name = "moyen_paiement")
    private String moyenPaiement; // "STRIPE_CARD", "APPLE_PAY", "GOOGLE_PAY", "GRATUIT"

    @Column(name = "stripe_payment_intent_id")
    private String stripePaymentIntentId;

    @Column(name = "stripe_session_id")
    private String stripeSessionId;

    @Column(name = "carte_last4")
    private String carteLast4;

    @Column(name = "carte_marque")
    private String carteMarque;

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @Column(name = "date_paiement")
    private LocalDateTime datePaiement;

    @Column(name = "recu_url", length = 1000)
    private String recuUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citoyen_id", nullable = false)
    private Citoyen citoyen;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false, unique = true)
    private Dossier dossier;
}
