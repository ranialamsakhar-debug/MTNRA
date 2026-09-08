package ma.tifawin.x0.features.reclamation.controller;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.features.reclamation.dto.ReclamationRequest;
import ma.tifawin.x0.features.reclamation.service.ReclamationService;
import ma.tifawin.x0.modules.core.entity.Dossier;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.security.Principal;

@RestController
@RequestMapping("/api/features/reclamations")
@RequiredArgsConstructor
public class ReclamationController {

    private final ReclamationService reclamationService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Dossier> soumettreReclamation(
            @ModelAttribute ReclamationRequest request,
            Principal principal) throws IOException {
        
        // Simuler le CIN du citoyen connecté (dans un vrai projet, extraire depuis le JWT Principal)
        String citoyenCin = principal != null ? principal.getName() : "CIN_TEST";
        
        Dossier dossier = reclamationService.creerReclamation(citoyenCin, request);
        return ResponseEntity.ok(dossier);
    }
}
