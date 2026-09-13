package ma.tifawin.x0.features.agent.controller;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.features.agent.service.AgentWorkflowService;
import ma.tifawin.x0.modules.core.entity.Dossier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/features/agents/workflow")
@RequiredArgsConstructor
public class AgentWorkflowController {

    private final AgentWorkflowService agentWorkflowService;

    // ── Étape 1 : Assigner un Agent de Réclamation ──

    @PostMapping("/dossiers/{dossierId}/assigner")
    public ResponseEntity<Dossier> assignerDossier(
            @PathVariable Long dossierId,
            @RequestParam Long agentId) {
        return ResponseEntity.ok(agentWorkflowService.assignerAgentReclamation(dossierId, agentId));
    }

    // ── Étape 2 : Transférer à Validation ──

    @PostMapping("/dossiers/{dossierId}/transferer-validation")
    public ResponseEntity<Dossier> transfererValidation(
            @PathVariable Long dossierId,
            @RequestParam Long agentValidationId,
            @RequestParam(required = false) String commentaire) {
        return ResponseEntity.ok(agentWorkflowService.transfererAValidation(dossierId, agentValidationId, commentaire));
    }

    // ── Étape 3 : Transférer à Certification ──

    @PostMapping("/dossiers/{dossierId}/transferer-certification")
    public ResponseEntity<Dossier> transfererCertification(
            @PathVariable Long dossierId,
            @RequestParam Long agentCertificationId,
            @RequestParam(required = false) String commentaire) {
        return ResponseEntity.ok(agentWorkflowService.transfererACertification(dossierId, agentCertificationId, commentaire));
    }

    // ── Étape 4 : Transférer à Signature ──

    @PostMapping("/dossiers/{dossierId}/transferer-signature")
    public ResponseEntity<Dossier> transfererSignature(
            @PathVariable Long dossierId,
            @RequestParam Long agentSignatureId,
            @RequestParam(required = false) String commentaire) {
        return ResponseEntity.ok(agentWorkflowService.transfererASignature(dossierId, agentSignatureId, commentaire));
    }

    // ── Étape 5 : Clôturer le dossier ──

    @PostMapping("/dossiers/{dossierId}/cloturer")
    public ResponseEntity<Dossier> cloturerDossier(
            @PathVariable Long dossierId,
            @RequestParam(required = false) String commentaire) {
        return ResponseEntity.ok(agentWorkflowService.cloturerDossier(dossierId, commentaire));
    }

    @PostMapping("/dossiers/{dossierId}/signer")
    public ResponseEntity<Dossier> signerDossier(
            @PathVariable Long dossierId,
            @RequestParam Long agentSignatureId,
            @RequestParam String imageSignature) {
        return ResponseEntity.ok(agentWorkflowService.signerDossier(dossierId, agentSignatureId, imageSignature));
    }

    // ── Rejeter le dossier ──

    @PostMapping("/dossiers/{dossierId}/rejeter")
    public ResponseEntity<Dossier> rejeterDossier(
            @PathVariable Long dossierId,
            @RequestParam Long agentId,
            @RequestParam(required = false) String motif) {
        return ResponseEntity.ok(agentWorkflowService.rejeterDossier(dossierId, agentId, motif));
    }

    // ── Demander des compléments au citoyen ──

    @PostMapping("/dossiers/{dossierId}/demander-complements")
    public ResponseEntity<Dossier> demanderComplements(
            @PathVariable Long dossierId,
            @RequestParam String message) {
        return ResponseEntity.ok(agentWorkflowService.demanderComplementsAuCitoyen(dossierId, message));
    }
}
