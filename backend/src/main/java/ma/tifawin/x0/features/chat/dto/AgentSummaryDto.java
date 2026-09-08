package ma.tifawin.x0.features.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgentSummaryDto {
    private Long id;
    private String matricule;
    private String nom;
    private String prenom;
    private String email;
    private String serviceAffectation;
    private String role;
}
