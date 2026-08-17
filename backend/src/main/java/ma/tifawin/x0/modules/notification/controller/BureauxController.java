package ma.tifawin.x0.modules.notification.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/bureaux")
public class BureauxController {

    @GetMapping
    public ResponseEntity<String> getBureaux() {
        return ResponseEntity.ok("TODO bureaux");
    }
}
