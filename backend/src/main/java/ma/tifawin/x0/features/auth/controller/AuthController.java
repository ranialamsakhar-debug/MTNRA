package ma.tifawin.x0.features.auth.controller;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.features.auth.dto.AuthResponse;
import ma.tifawin.x0.features.auth.dto.LoginRequest;
import ma.tifawin.x0.features.auth.dto.RegisterRequest;
import ma.tifawin.x0.features.auth.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController("FeatureAuthController")
@RequestMapping("/api/features/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }
}
