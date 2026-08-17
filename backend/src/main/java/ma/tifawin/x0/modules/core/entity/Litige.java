package ma.tifawin.x0.modules.core.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.tifawin.x0.common.enums.LitigeStatut;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "litiges")
public class Litige {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLitige;

    @Column(nullable = false, unique = true)
    private String numeroLitige;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citoyen_id", nullable = false)
    private Citoyen citoyen;

    private String motif;

    @Column(length = 5000)
    private String description;

    @Column(nullable = false)
    private LocalDateTime dateSaisine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LitigeStatut statut = LitigeStatut.SOUMIS;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mediateur_id")
    private Mediateur mediateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_concerne_id")
    private ServiceEntity serviceConcerne;

    @Column(length = 5000)
    private String recommandation;

    private LocalDateTime dateRecommandation;

    private LocalDateTime dateMiseEnOeuvre;
}
