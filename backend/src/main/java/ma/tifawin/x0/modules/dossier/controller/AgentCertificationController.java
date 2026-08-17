package ma.tifawin.x0.modules.dossier.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agent-certification")
public class AgentCertificationController {

    @GetMapping("/dossiers")
    public ResponseEntity<String> getDossiers() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/dossiers/{id}")
    public ResponseEntity<String> getDossier(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/dossiers/{id}/verifier")
    public ResponseEntity<String> verifier(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/dossiers/{id}/certifier")
    public ResponseEntity<String> certifier(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/dossiers/{id}/falsification")
    public ResponseEntity<String> falsification(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }
}
