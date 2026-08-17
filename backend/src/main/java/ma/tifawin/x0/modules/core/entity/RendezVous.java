package ma.tifawin.x0.modules.core.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.tifawin.x0.common.enums.RendezVousStatut;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "rendez_vous")
public class RendezVous {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idRdv;

    private LocalDate dateRdv;

    private LocalTime heureRdv;

    private Integer duree;

    private String motif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RendezVousStatut statut = RendezVousStatut.DEMANDE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citoyen_id", nullable = false)
    private Citoyen citoyen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceEntity service;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id")
    private Agent agent;

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    private LocalDateTime dateModification;
}
