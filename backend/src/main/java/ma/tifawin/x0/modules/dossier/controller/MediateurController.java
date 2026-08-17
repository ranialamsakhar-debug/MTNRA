package ma.tifawin.x0.modules.dossier.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/mediateur")
public class MediateurController {

    @GetMapping("/saisines")
    public ResponseEntity<String> getSaisines() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/saisines/{id}")
    public ResponseEntity<String> getSaisine(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/saisines/{id}/recommandation")
    public ResponseEntity<String> recommandation(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PutMapping("/saisines/{id}/suivre")
    public ResponseEntity<String> suivre(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/saisines/{id}/relancer")
    public ResponseEntity<String> relancer(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @GetMapping("/statistiques")
    public ResponseEntity<String> statistiques() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/rapports")
    public ResponseEntity<String> rapports() { return ResponseEntity.ok("TODO"); }
}
