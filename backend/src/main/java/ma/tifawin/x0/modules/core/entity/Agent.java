package ma.tifawin.x0.modules.core.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.tifawin.x0.common.enums.AgentStatus;
import ma.tifawin.x0.common.enums.NiveauHabilitation;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "agents")
@Inheritance(strategy = InheritanceType.JOINED)
public abstract class Agent extends Utilisateur {

    @Column(nullable = false, unique = true)
    private String matricule;

    @Column(name = "service_affectation")
    private String serviceAffectation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AgentStatus statut = AgentStatus.ACTIF;

    @Enumerated(EnumType.STRING)
    @Column(name = "niveau_habilitation", nullable = false)
    private NiveauHabilitation niveauHabilitation = NiveauHabilitation.NIVEAU_1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "superviseur_id")
    private ResponsableService superviseur;
}
