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
@Table(name = "messages_internes")
public class MessageInterne {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMessage;

    @Column(nullable = false, length = 5000)
    private String contenu;

    @Column(nullable = false)
    private LocalDateTime dateEnvoi;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expediteur_id", nullable = false)
    private Agent expediteur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinataire_id")
    private Agent destinataire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "canal_id")
    private CanalChat canal;

    @Column(nullable = false)
    private Boolean lu = false;

    private LocalDateTime dateLecture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "piece_jointe_id")
    private Document pieceJointe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_parent_id")
    private MessageInterne messageParent;
}
