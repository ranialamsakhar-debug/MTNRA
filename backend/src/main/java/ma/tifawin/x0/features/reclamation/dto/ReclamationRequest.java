package ma.tifawin.x0.features.reclamation.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Data
public class ReclamationRequest {
    private String typeDemandeCode;
    
    // Contenu de la réclamation, selon l'accessibilité
    private String descriptionTexte; 
    private MultipartFile fichierAudio;
    private MultipartFile fichierVideo;
    
    // Documents joints
    private List<MultipartFile> documents;
}
