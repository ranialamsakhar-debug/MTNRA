package ma.tifawin.x0.features.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/features/auth/otp")
public class OtpController {

    // Stockage OTP en mémoire par identifiant (CNI)
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();

    @PostMapping(value = "/send", consumes = org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> sendOtp(
            @RequestParam("identifier") String identifier,
            @RequestParam("email") String email,
            @RequestParam("telephone") String telephone) {
        
        // 1. Générer un code à 6 chiffres aléatoire
        String otp = String.format("%06d", new Random().nextInt(899999) + 100000);
        
        // 2. Sauvegarder en mémoire associé à l'identifiant (CNI)
        otpStorage.put(identifier, otp);
        
        // 3. Tenter l'envoi réel via l'API Twilio SMS (si configurée)
        sendTwilioSms(telephone, otp);

        // 4. Affichage dans la console du serveur
        System.out.println("\n=========================================================");
        System.out.println("📱 [TAWSA OTP SMS SERVICE]");
        System.out.println("Destinataire : " + telephone);
        System.out.println("Code OTP Généré : " + otp);
        System.out.println("=========================================================\n");

        return ResponseEntity.ok(Map.of(
            "message", "OTP envoyé avec succès",
            "status", "success",
            "dev_otp", otp,
            "telephone", telephone
        ));
    }

    @PostMapping(value = "/verify", consumes = org.springframework.http.MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    public ResponseEntity<?> verifyOtp(
            @RequestParam("identifier") String identifier,
            @RequestParam("email") String email,
            @RequestParam("code") String code) {
        
        // 1. Récupérer le code sauvegardé pour cet identifiant
        String savedOtp = otpStorage.get(identifier);

        // 2. Comparer avec le code saisi par l'utilisateur
        if (savedOtp != null && savedOtp.trim().equals(code.trim())) {
            // Le code est valide, on le supprime (usage unique)
            otpStorage.remove(identifier);
            return ResponseEntity.ok(Map.of("message", "Vérification réussie", "status", "success", "token", "fake-jwt-token"));
        } else {
            return ResponseEntity.status(401).body(Map.of("message", "Code OTP incorrect", "status", "error"));
        }
    }

    /**
     * Envoie un SMS réel à destination d'un numéro de téléphone via l'API REST Twilio.
     */
    private void sendTwilioSms(String toPhone, String otpCode) {
        String accountSid = System.getenv().getOrDefault("TWILIO_ACCOUNT_SID", System.getProperty("twilio.account.sid", ""));
        String authToken = System.getenv().getOrDefault("TWILIO_AUTH_TOKEN", System.getProperty("twilio.auth.token", ""));
        String fromPhone = System.getenv().getOrDefault("TWILIO_PHONE_NUMBER", System.getProperty("twilio.phone.number", ""));

        if (accountSid.isEmpty() || authToken.isEmpty() || fromPhone.isEmpty()) {
            System.out.println("⚠️ Twilio non configuré dans l'environnement (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER).");
            return;
        }

        try {
            // Formater au format international E.164 (+212...)
            String formattedTo = toPhone != null ? toPhone.replaceAll("\\s+", "") : "";
            if (formattedTo.startsWith("0")) {
                formattedTo = "+212" + formattedTo.substring(1);
            } else if (!formattedTo.startsWith("+")) {
                formattedTo = "+" + formattedTo;
            }

            String twilioUrl = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
            String messageBody = "Votre code de securite Tawsa est : " + otpCode + ". Valide 5 min.";

            HttpClient client = HttpClient.newHttpClient();
            String auth = accountSid + ":" + authToken;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

            String form = "From=" + URLEncoder.encode(fromPhone, StandardCharsets.UTF_8)
                    + "&To=" + URLEncoder.encode(formattedTo, StandardCharsets.UTF_8)
                    + "&Body=" + URLEncoder.encode(messageBody, StandardCharsets.UTF_8);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(twilioUrl))
                    .header("Authorization", "Basic " + encodedAuth)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            System.out.println("📲 Twilio API Statut : " + response.statusCode());
            System.out.println("📲 Twilio API Réponse : " + response.body());
        } catch (Exception e) {
            System.err.println("❌ Erreur d'envoi SMS Twilio : " + e.getMessage());
        }
    }
}
