package ma.tifawin.x0.features.agent.controller;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.features.agent.service.LitigeWorkflowService;
import ma.tifawin.x0.modules.core.entity.Litige;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/features/litiges")
@RequiredArgsConstructor
public class LitigeWorkflowController {

    private final LitigeWorkflowService litigeWorkflowService;

    // ── Étape 1 : Citoyen saisit le médiateur ──

    @PostMapping("/saisir")
    public ResponseEntity<Litige> saisirMediateur(
            @RequestParam Long dossierId,
            @RequestParam Long citoyenId,
            @RequestParam String motif,
            @RequestParam(required = false) String description) {
        return ResponseEntity.ok(litigeWorkflowService.saisirMediateur(dossierId, citoyenId, motif, description));
    }

    // ── Étape 2 : Médiateur instruit le litige ──

    @PostMapping("/{litigeId}/instruire")
    public ResponseEntity<Litige> instruireLitige(
            @PathVariable Long litigeId,
            @RequestParam Long mediateurId) {
        return ResponseEntity.ok(litigeWorkflowService.instruireLitige(litigeId, mediateurId));
    }

    // ── Étape 3 : Médiateur émet une recommandation ──

    @PostMapping("/{litigeId}/recommander")
    public ResponseEntity<Litige> emettreRecommandation(
            @PathVariable Long litigeId,
            @RequestParam String recommandation) {
        return ResponseEntity.ok(litigeWorkflowService.emettreRecommandation(litigeId, recommandation));
    }

    // ── Étape 4a : Responsable applique la recommandation → Clôture ──

    @PostMapping("/{litigeId}/appliquer")
    public ResponseEntity<Litige> appliquerRecommandation(
            @PathVariable Long litigeId,
            @RequestParam Long responsableId) {
        return ResponseEntity.ok(litigeWorkflowService.appliquerRecommandation(litigeId, responsableId));
    }

    // ── Étape 4b : Responsable rejette définitivement ──

    @PostMapping("/{litigeId}/rejeter-definitif")
    public ResponseEntity<Litige> rejeterDefinitivement(
            @PathVariable Long litigeId,
            @RequestParam Long responsableId,
            @RequestParam(required = false) String motif) {
        return ResponseEntity.ok(litigeWorkflowService.rejeterDefinitivement(litigeId, responsableId, motif));
    }
}
