package ma.tifawin.x0.features.auth.service;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.common.enums.Role;
import ma.tifawin.x0.features.auth.dto.AuthResponse;
import ma.tifawin.x0.features.auth.dto.LoginRequest;
import ma.tifawin.x0.features.auth.dto.RegisterRequest;
import ma.tifawin.x0.features.citoyen.entity.DatasetReferenceCitoyen;
import ma.tifawin.x0.features.citoyen.repository.DatasetReferenceCitoyenRepository;
import ma.tifawin.x0.modules.core.entity.Citoyen;
import ma.tifawin.x0.modules.core.repository.CitoyenRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final CitoyenRepository citoyenRepository;
    private final DatasetReferenceCitoyenRepository datasetReferenceCitoyenRepository;
    // In a real app we inject PasswordEncoder and JwtService here

    public AuthResponse register(RegisterRequest request) {
        // 1. Check if user exists in the Golden Record Dataset
        DatasetReferenceCitoyen reference = datasetReferenceCitoyenRepository.findByCni(request.getCin())
                .orElseThrow(() -> new RuntimeException("Erreur: Les informations de la CNI ne correspondent à aucun citoyen enregistré dans le Golden Record."));
        
        // Check if date de naissance matches
        LocalDate dateNaissance = LocalDate.parse(request.getDateNaissance());
        if (!reference.getDateNaissance().equals(dateNaissance)) {
            throw new RuntimeException("Erreur: La date de naissance ne correspond pas.");
        }

        // 2. Check if account is already created
        if (reference.getCompteCree()) {
            throw new RuntimeException("Erreur: Un compte existe déjà pour cette CNI. Veuillez récupérer votre mot de passe.");
        }

        // 3. Create the Citoyen entity
        Citoyen citoyen = new Citoyen();
        citoyen.setCin(reference.getCni());
        citoyen.setNom(reference.getNom());
        citoyen.setPrenom(reference.getPrenom());
        citoyen.setDateNaissance(reference.getDateNaissance());
        citoyen.setEmail(request.getEmail());
        citoyen.setTelephoneMobile(request.getTelephone());
        citoyen.setTelephone(request.getTelephone());
        citoyen.setMotDePasse(request.getMotDePasse()); // TODO: encode password
        citoyen.setRole(Role.CITOYEN);
        citoyen.setDateCreation(LocalDateTime.now());
        
        citoyenRepository.save(citoyen);

        // Mark account as created in Golden Record
        reference.setCompteCree(true);
        datasetReferenceCitoyenRepository.save(reference);

        // Return mock token
        return new AuthResponse("mock-jwt-token", citoyen.getCin(), citoyen.getNom(), citoyen.getPrenom(), citoyen.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        Citoyen citoyen = citoyenRepository.findByCin(request.getCin())
                .orElseThrow(() -> new RuntimeException("Utilisateur introuvable."));
        
        if (!citoyen.getMotDePasse().equals(request.getMotDePasse())) { // TODO: matches password
            throw new RuntimeException("Mot de passe incorrect.");
        }
        
        return new AuthResponse("mock-jwt-token", citoyen.getCin(), citoyen.getNom(), citoyen.getPrenom(), citoyen.getRole());
    }
}
