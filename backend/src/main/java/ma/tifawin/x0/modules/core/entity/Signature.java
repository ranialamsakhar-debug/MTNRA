package ma.tifawin.x0.modules.core.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "signatures")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Signature {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idSignature;

    @Column(nullable = false)
    private LocalDateTime dateSignature;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citoyen_id", nullable = false)
    private Citoyen citoyen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_signature_id", nullable = false)
    private AgentSignature agentSignature;
}
