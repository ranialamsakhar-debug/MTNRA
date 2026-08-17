package ma.tifawin.x0.modules.auth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<String> login() { return ResponseEntity.ok("TODO login"); }

    @PostMapping("/logout")
    public ResponseEntity<String> logout() { return ResponseEntity.ok("TODO logout"); }

    @PostMapping("/register")
    public ResponseEntity<String> register() { return ResponseEntity.ok("TODO register"); }

    @PostMapping("/refresh-token")
    public ResponseEntity<String> refreshToken() { return ResponseEntity.ok("TODO refresh-token"); }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword() { return ResponseEntity.ok("TODO forgot-password"); }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword() { return ResponseEntity.ok("TODO reset-password"); }

    @GetMapping("/me")
    public ResponseEntity<String> me() { return ResponseEntity.ok("TODO me"); }
}
