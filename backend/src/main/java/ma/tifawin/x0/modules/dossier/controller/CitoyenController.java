package ma.tifawin.x0.modules.dossier.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/citoyen")
public class CitoyenController {

    @GetMapping("/dossiers")
    public ResponseEntity<String> getDossiers() { return ResponseEntity.ok("TODO get dossiers"); }

    @PostMapping("/dossiers")
    public ResponseEntity<String> createDossier() { return ResponseEntity.ok("TODO create dossier"); }

    @GetMapping("/dossiers/{id}")
    public ResponseEntity<String> getDossier(@PathVariable Long id) { return ResponseEntity.ok("TODO get dossier " + id); }

    @GetMapping("/dossiers/{id}/statut")
    public ResponseEntity<String> getDossierStatut(@PathVariable Long id) { return ResponseEntity.ok("TODO get statut " + id); }

    @PostMapping("/dossiers/{id}/documents")
    public ResponseEntity<String> uploadDocument(@PathVariable Long id) { return ResponseEntity.ok("TODO upload document " + id); }

    @GetMapping("/dossiers/{id}/documents")
    public ResponseEntity<String> getDocuments(@PathVariable Long id) { return ResponseEntity.ok("TODO get documents " + id); }

    @PostMapping("/dossiers/{id}/signature")
    public ResponseEntity<String> signer(@PathVariable Long id) { return ResponseEntity.ok("TODO signer " + id); }

    @PostMapping("/dossiers/{id}/litige")
    public ResponseEntity<String> saisirLitige(@PathVariable Long id) { return ResponseEntity.ok("TODO litige " + id); }

    @GetMapping("/rdv")
    public ResponseEntity<String> getRdv() { return ResponseEntity.ok("TODO get rdv"); }

    @PostMapping("/rdv")
    public ResponseEntity<String> createRdv() { return ResponseEntity.ok("TODO create rdv"); }

    @PutMapping("/rdv/{id}")
    public ResponseEntity<String> updateRdv(@PathVariable Long id) { return ResponseEntity.ok("TODO update rdv " + id); }

    @GetMapping("/historique")
    public ResponseEntity<String> getHistorique() { return ResponseEntity.ok("TODO get historique"); }

    @PostMapping("/avis")
    public ResponseEntity<String> postAvis() { return ResponseEntity.ok("TODO post avis"); }

    @PutMapping("/profil")
    public ResponseEntity<String> updateProfil() { return ResponseEntity.ok("TODO update profil"); }
}
