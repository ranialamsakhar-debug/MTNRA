package ma.tifawin.x0.features.reclamation.service;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.common.enums.DossierStatut;
import ma.tifawin.x0.features.reclamation.dto.ReclamationRequest;
import ma.tifawin.x0.modules.core.entity.Citoyen;
import ma.tifawin.x0.modules.core.entity.Dossier;
import ma.tifawin.x0.modules.core.entity.TypeDemande;
import ma.tifawin.x0.modules.core.repository.CitoyenRepository;
import ma.tifawin.x0.modules.core.repository.DossierRepository;
import ma.tifawin.x0.modules.core.repository.TypeDemandeRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReclamationService {

    private final DossierRepository dossierRepository;
    private final TypeDemandeRepository typeDemandeRepository;
    private final CitoyenRepository citoyenRepository;
    
    // In a real scenario, use @Value for service URLs
    private final String sttServiceUrl = "http://localhost:8004/transcribe"; // stt-service
    private final String lsmServiceUrl = "http://localhost:8003/translate"; // lsm-service
    private final RestTemplate restTemplate = new RestTemplate();

    public Dossier creerReclamation(String citoyenCin, ReclamationRequest request) throws IOException {
        Citoyen citoyen = citoyenRepository.findByCin(citoyenCin)
                .orElseThrow(() -> new RuntimeException("Citoyen introuvable"));

        TypeDemande typeDemande = typeDemandeRepository.findByCode(request.getTypeDemandeCode())
                .orElseThrow(() -> new RuntimeException("Type de demande introuvable"));

        String descriptionFinale = request.getDescriptionTexte();

        // 1. Gérer l'accessibilité via l'IA
        if (request.getFichierAudio() != null && !request.getFichierAudio().isEmpty()) {
            descriptionFinale = appelerServiceSTT(request.getFichierAudio());
        } else if (request.getFichierVideo() != null && !request.getFichierVideo().isEmpty()) {
            descriptionFinale = appelerServiceLSM(request.getFichierVideo());
        }

        if (descriptionFinale == null || descriptionFinale.trim().isEmpty()) {
            throw new RuntimeException("La description de la réclamation ne peut pas être vide");
        }

        // 2. Créer le dossier
        Dossier dossier = new Dossier();
        dossier.setNumeroDossier("REC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        dossier.setDateCreation(LocalDateTime.now());
        dossier.setTypeDemande(typeDemande);
        dossier.setCitoyen(citoyen);
        dossier.setDescription(descriptionFinale);
        dossier.setStatut(DossierStatut.SOUMIS); // En attente d'affectation

        // 3. TODO: Gérer la sauvegarde des documents joints (request.getDocuments())
        
        return dossierRepository.save(dossier);
    }

    private String appelerServiceSTT(MultipartFile audio) throws IOException {
        return envoyerFichierAuService(audio, sttServiceUrl, "audio");
    }

    private String appelerServiceLSM(MultipartFile video) throws IOException {
        return envoyerFichierAuService(video, lsmServiceUrl, "video");
    }

    private String envoyerFichierAuService(MultipartFile fichier, String url, String partName) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add(partName, new ByteArrayResource(fichier.getBytes()) {
            @Override
            public String getFilename() {
                return fichier.getOriginalFilename();
            }
        });

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
        
        try {
            ResponseEntity<String> response = restTemplate.postForEntity(url, requestEntity, String.class);
            return response.getBody();
        } catch (Exception e) {
            // Log error
            return "Erreur de transcription automatique.";
        }
    }
}
