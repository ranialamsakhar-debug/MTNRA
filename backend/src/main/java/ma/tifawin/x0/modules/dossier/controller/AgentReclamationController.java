package ma.tifawin.x0.modules.dossier.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agent-reclamation")
public class AgentReclamationController {

    @GetMapping("/dossiers")
    public ResponseEntity<String> getDossiers() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/dossiers/{id}")
    public ResponseEntity<String> getDossier(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PutMapping("/dossiers/{id}/qualifier")
    public ResponseEntity<String> qualifier(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/dossiers/{id}/reponse")
    public ResponseEntity<String> reponse(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PutMapping("/dossiers/{id}/transmettre")
    public ResponseEntity<String> transmettre(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PutMapping("/dossiers/{id}/cloturer")
    public ResponseEntity<String> cloturer(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @GetMapping("/charge")
    public ResponseEntity<String> charge() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/messages")
    public ResponseEntity<String> getMessages() { return ResponseEntity.ok("TODO"); }

    @PostMapping("/messages")
    public ResponseEntity<String> postMessage() { return ResponseEntity.ok("TODO"); }
}
