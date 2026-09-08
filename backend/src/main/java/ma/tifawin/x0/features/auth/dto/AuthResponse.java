package ma.tifawin.x0.features.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import ma.tifawin.x0.common.enums.Role;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String cin;
    private String nom;
    private String prenom;
    private Role role;
}
