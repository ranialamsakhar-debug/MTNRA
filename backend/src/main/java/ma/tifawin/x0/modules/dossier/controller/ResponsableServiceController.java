package ma.tifawin.x0.modules.dossier.controller;

import java.time.LocalDate;
import java.util.List;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.features.agent.service.MediateurDisponibiliteService;
import ma.tifawin.x0.features.agent.dto.MediateurPropositionDto;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/responsable-service")
@RequiredArgsConstructor
public class ResponsableServiceController {

    private final MediateurDisponibiliteService mediateurDisponibiliteService;

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

    @GetMapping("/mediateurs/propositions")
    public ResponseEntity<List<MediateurPropositionDto>> proposerMediateurs(
            @RequestParam LocalDate date) {
        return ResponseEntity.ok( mediateurDisponibiliteService.proposer(date));
    }

    @GetMapping("/creneaux")
    public ResponseEntity<String> getCreneaux() { return ResponseEntity.ok("TODO"); }

    @PostMapping("/creneaux")
    public ResponseEntity<String> createCreneau() { return ResponseEntity.ok("TODO"); }

    @PutMapping("/creneaux/{id}")
    public ResponseEntity<String> updateCreneau(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }
}
