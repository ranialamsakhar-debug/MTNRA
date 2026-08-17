package ma.tifawin.x0.modules.core.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.tifawin.x0.common.enums.ChatbotAuteur;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "messages_chatbot")
public class MessageChatbot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMessage;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private ConversationChatbot conversation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatbotAuteur auteur;

    @Column(nullable = false, length = 5000)
    private String contenu;

    @Column(nullable = false)
    private LocalDateTime dateEnvoi;

    @Column(columnDefinition = "TEXT")
    private String sources;
}
