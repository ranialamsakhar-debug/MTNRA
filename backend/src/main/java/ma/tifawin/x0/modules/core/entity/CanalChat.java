package ma.tifawin.x0.modules.core.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.tifawin.x0.common.enums.CanalType;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "canaux_chat")
public class CanalChat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idCanal;

    @Column(nullable = false)
    private String nom;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CanalType type = CanalType.GROUPE_DEPARTEMENT;

    private String departement; // Ex: "RECLAMATION", "VALIDATION", "MEDIATION", "DIRECTION"

    @Column(name = "date_creation", nullable = false)
    private LocalDateTime dateCreation = LocalDateTime.now();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "canaux_membres",
        joinColumns = @JoinColumn(name = "canal_id"),
        inverseJoinColumns = @JoinColumn(name = "agent_id")
    )
    private Set<Agent> membres = new HashSet<>();

    @OneToMany(mappedBy = "canal", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("dateEnvoi ASC")
    private List<MessageInterne> messages = new ArrayList<>();
}
