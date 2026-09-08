package ma.tifawin.x0.features.auth.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String cin;
    private String nom;
    private String prenom;
    private String email;
    private String motDePasse;
    private String telephone;
    private String dateNaissance; // YYYY-MM-DD
}
