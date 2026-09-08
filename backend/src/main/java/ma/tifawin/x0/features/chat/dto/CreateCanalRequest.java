package ma.tifawin.x0.features.chat.dto;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import ma.tifawin.x0.common.enums.CanalType;

@Data
public class CreateCanalRequest {

    @NotBlank(message = "Le nom du canal est obligatoire")
    private String nom;

    private String description;

    @NotNull(message = "Le type de canal est obligatoire")
    private CanalType type; // PRIVE_DIRECT, GROUPE_DEPARTEMENT, GROUPE_INTER_DEPARTEMENT

    private String departement;

    private List<Long> membreAgentIds;
}
