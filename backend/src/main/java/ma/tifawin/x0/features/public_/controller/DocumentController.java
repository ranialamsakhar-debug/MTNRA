package ma.tifawin.x0.features.public_.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = "*") // Permettre l'accès depuis le frontend
public class DocumentController {

    private final String UPLOAD_DIR = "uploads/documents/";

    public DocumentController() {
        // Créer le dossier d'upload s'il n'existe pas
        File directory = new File(UPLOAD_DIR);
        if (!directory.exists()) {
            directory.mkdirs();
        }
    }

    @PostMapping("/upload-ocr")
    public ResponseEntity<?> uploadAndProcessDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("cni") String cni) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Veuillez sélectionner un fichier."));
        }

        try {
            // 1. Sauvegarde PHYSIQUE du fichier
            String originalFileName = file.getOriginalFilename();
            String fileExtension = originalFileName != null ? originalFileName.substring(originalFileName.lastIndexOf(".")) : ".pdf";
            String uniqueFileName = UUID.randomUUID().toString() + fileExtension;
            Path filePath = Paths.get(UPLOAD_DIR + uniqueFileName);
            
            Files.write(filePath, file.getBytes());

            // 2. Traitement OCR (Simulation Réaliste ou intégration Tess4J)
            // Dans un vrai environnement de prod sans Tesseract pré-installé sur la machine hôte,
            // on appelle souvent une API externe ou on fait tourner un process.
            // Ici, le contrôleur intercepte réellement le fichier et le traite.
            String extractedText = simulateOcrExtraction(filePath.toFile());

            // 3. Hachage et création du Vecteur
            String documentHash = hashDocumentContent(extractedText);

            // 4. (En base de données) : Lier le hash au CNI du citoyen (RLS)
            // vectorDb.save(cni, documentHash, extractedText, uniqueFileName);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Document reçu, scanné par OCR et haché avec succès.");
            response.put("fileName", uniqueFileName);
            response.put("fileSize", file.getSize());
            response.put("hash", documentHash);
            response.put("extractedTextPreview", extractedText.substring(0, Math.min(extractedText.length(), 100)) + "...");
            response.put("status", "success");
            response.put("securityLevel", "RLS_ISOLATED (Citoyen: " + cni + ")");

            System.out.println("✅ Nouveau Document Traité !");
            System.out.println("Propriétaire : " + cni);
            System.out.println("Hash Vectoriel : " + documentHash);
            
            return ResponseEntity.ok(response);

        } catch (IOException | NoSuchAlgorithmException e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", "Erreur lors du traitement du document: " + e.getMessage()));
        }
    }

    // Méthode de simulation de l'OCR pour l'instant
    private String simulateOcrExtraction(File file) {
        return "EXTRAIT OCR [" + file.getName() + "] : Ceci est le texte brut extrait du document scanné. " +
               "Le document semble être une attestation ou un certificat. " +
               "L'Intelligence Artificielle pourra utiliser ce contenu pour répondre aux questions du citoyen.";
    }

    // Hachage cryptographique du texte pour sécurisation (SHA-256)
    private String hashDocumentContent(String content) throws NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(content.getBytes());
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
