package ma.tifawin.x0.features.chat.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private Long idMessage;
    private Long canalId;
    private Long expediteurId;
    private String expediteurNom;
    private String expediteurPrenom;
    private String expediteurService;
    private String contenu;
    private LocalDateTime dateEnvoi;
    private Boolean lu;
}
