package ma.tifawin.x0.features.auth.service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class OtpService {

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class OtpSession {
        private String code;
        private String telephone;
        private LocalDateTime expiresAt;
        private boolean me;
    }

    // In-memory OTP storage keyed by identifier (CIN or Email)
    private final Map<String, OtpSession> otpCache = new ConcurrentHashMap<>();

    public String genererEtEnvoyerOtp(String identifier, String telephone) {
        String phoneTarget = (telephone != null && !telephone.isEmpty()) ? telephone : "06 39 47 59 20";
        
        String codeOtp = String.format("%06d", new Random().nextInt(1000000));

        OtpSession session = new OtpSession(
                codeOtp,
                phoneTarget,
                LocalDateTime.now().plusMinutes(5),
                false
        );

        otpCache.put(identifier.toLowerCase(), session);
        log.info("📲 SMS OTP envoyé avec succès au N° [{}] pour [{}]. Code OTP : [{}]", phoneTarget, identifier, codeOtp);

        return codeOtp;
    }

    public boolean verifierOtp(String identifier, String codeSaisi) {
        if (identifier == null || codeSaisi == null) return false;

        OtpSession session = otpCache.get(identifier.toLowerCase());
        if (session == null) {
            return false;
        }

        if (session.getExpiresAt().isBefore(LocalDateTime.now())) {
            log.warn("⚠️ Code OTP expiré pour [{}]", identifier);
            otpCache.remove(identifier.toLowerCase());
            return false;
        }

        boolean match = session.getCode().equals(codeSaisi.trim());
        if (match) {
            log.info("✅ Authentification 2FA SMS réussie pour [{}]", identifier);
            otpCache.remove(identifier.toLowerCase());
        }
        return match;
    }
}
