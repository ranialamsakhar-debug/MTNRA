package ma.tifawin.x0.modules.core.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.tifawin.x0.common.enums.TypeAction;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "historique_actions")
public class HistoriqueAction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeAction typeAction;

    @Column(nullable = false)
    private LocalDateTime dateHeure;

    @Column(length = 5000)
    private String details;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;

    private String ipAdresse;

    private String userAgent;
}
