package ma.tifawin.x0.features.chat.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.tifawin.x0.common.enums.CanalType;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CanalResponse {
    private Long idCanal;
    private String nom;
    private String description;
    private CanalType type;
    private String departement;
    private LocalDateTime dateCreation;
    private int nombreMembres;
    private List<AgentSummaryDto> membres;
    private MessageResponse dernierMessage;
    private long nonLusCount;
}
