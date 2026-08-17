package ma.tifawin.x0.modules.dossier.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/agent-signature")
public class AgentSignatureController {

    @GetMapping("/dossiers")
    public ResponseEntity<String> getDossiers() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/dossiers/{id}")
    public ResponseEntity<String> getDossier(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/dossiers/{id}/signer")
    public ResponseEntity<String> signer(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/dossiers/{id}/envoyer")
    public ResponseEntity<String> envoyer(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/dossiers/{id}/confirmer-reception")
    public ResponseEntity<String> confirmerReception(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PostMapping("/signature-groupee")
    public ResponseEntity<String> signatureGroupee() { return ResponseEntity.ok("TODO"); }

    @PostMapping("/dossiers/{id}/archiver")
    public ResponseEntity<String> archiver(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }
}
