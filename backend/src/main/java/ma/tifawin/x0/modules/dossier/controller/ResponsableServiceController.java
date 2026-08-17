package ma.tifawin.x0.modules.dossier.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/responsable-service")
public class ResponsableServiceController {

    @GetMapping("/litiges")
    public ResponseEntity<String> getLitiges() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/litiges/{id}")
    public ResponseEntity<String> getLitige(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/litiges/{id}/reponse")
    public ResponseEntity<String> postReponse(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PutMapping("/litiges/{id}/mettre-en-oeuvre")
    public ResponseEntity<String> mettreEnOeuvre(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @GetMapping("/agents")
    public ResponseEntity<String> getAgents() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/statistiques")
    public ResponseEntity<String> getStats() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/creneaux")
    public ResponseEntity<String> getCreneaux() { return ResponseEntity.ok("TODO"); }

    @PostMapping("/creneaux")
    public ResponseEntity<String> createCreneau() { return ResponseEntity.ok("TODO"); }

    @PutMapping("/creneaux/{id}")
    public ResponseEntity<String> updateCreneau(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }
}
