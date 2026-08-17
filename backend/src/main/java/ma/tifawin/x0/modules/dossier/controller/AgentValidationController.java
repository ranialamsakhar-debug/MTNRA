package ma.tifawin.x0.modules.dossier.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agent-validation")
public class AgentValidationController {

    @GetMapping("/dossiers")
    public ResponseEntity<String> getDossiers() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/dossiers/{id}")
    public ResponseEntity<String> getDossier(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PutMapping("/dossiers/{id}/valider")
    public ResponseEntity<String> valider(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PutMapping("/dossiers/{id}/rejeter")
    public ResponseEntity<String> rejeter(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/dossiers/{id}/anomalie")
    public ResponseEntity<String> anomalie(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @GetMapping("/historique")
    public ResponseEntity<String> historique() { return ResponseEntity.ok("TODO"); }

    @PutMapping("/dossiers/{id}/transmettre")
    public ResponseEntity<String> transmettre(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }
}
