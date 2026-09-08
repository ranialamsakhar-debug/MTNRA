package ma.tifawin.x0.features.auth.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String cin; // We use CIN for login instead of email for Golden Record
    private String motDePasse;
}
