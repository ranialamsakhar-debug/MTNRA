package ma.tifawin.x0.modules.core.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.tifawin.x0.common.enums.DossierStatut;
import ma.tifawin.x0.common.enums.Priorite;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "dossiers")
public class Dossier {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idDossier;

    @Column(nullable = false, unique = true)
    private String numeroDossier;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateCloture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_demande_id", nullable = false)
    private TypeDemande typeDemande;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DossierStatut statut = DossierStatut.BROUILLON;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citoyen_id", nullable = false)
    private Citoyen citoyen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_reclamation_id")
    private AgentReclamation agentReclamation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_validation_id")
    private AgentValidation agentValidation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_certification_id")
    private AgentCertification agentCertification;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_signature_id")
    private AgentSignature agentSignature;

    @Column(length = 5000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priorite priorite = Priorite.NORMALE;
}
