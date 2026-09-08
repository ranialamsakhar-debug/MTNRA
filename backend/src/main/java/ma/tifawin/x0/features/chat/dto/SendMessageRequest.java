package ma.tifawin.x0.features.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendMessageRequest {

    @NotNull(message = "Le canal de discussion est obligatoire")
    private Long canalId;

    @NotNull(message = "L'expéditeur est obligatoire")
    private Long expediteurId;

    @NotBlank(message = "Le message ne peut pas être vide")
    private String contenu;
}
