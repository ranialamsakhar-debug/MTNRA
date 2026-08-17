package ma.tifawin.x0.modules.admin.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/utilisateurs")
    public ResponseEntity<String> getUtilisateurs() { return ResponseEntity.ok("TODO"); }

    @PostMapping("/utilisateurs")
    public ResponseEntity<String> createUtilisateur() { return ResponseEntity.ok("TODO"); }

    @PutMapping("/utilisateurs/{id}")
    public ResponseEntity<String> updateUtilisateur(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @DeleteMapping("/utilisateurs/{id}")
    public ResponseEntity<String> deleteUtilisateur(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @PutMapping("/utilisateurs/{id}/roles")
    public ResponseEntity<String> setRoles(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @GetMapping("/type-demandes")
    public ResponseEntity<String> getTypeDemandes() { return ResponseEntity.ok("TODO"); }

    @PostMapping("/type-demandes")
    public ResponseEntity<String> createTypeDemande() { return ResponseEntity.ok("TODO"); }

    @PutMapping("/type-demandes/{id}")
    public ResponseEntity<String> updateTypeDemande(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @DeleteMapping("/type-demandes/{id}")
    public ResponseEntity<String> deleteTypeDemande(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @GetMapping("/workflows")
    public ResponseEntity<String> getWorkflows() { return ResponseEntity.ok("TODO"); }

    @PostMapping("/workflows")
    public ResponseEntity<String> createWorkflow() { return ResponseEntity.ok("TODO"); }

    @PutMapping("/workflows/{id}")
    public ResponseEntity<String> updateWorkflow(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @GetMapping("/audit")
    public ResponseEntity<String> getAudit() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/dashboard")
    public ResponseEntity<String> getDashboard() { return ResponseEntity.ok("TODO"); }

    @GetMapping("/actualites")
    public ResponseEntity<String> getActualites() { return ResponseEntity.ok("TODO"); }

    @PostMapping("/actualites")
    public ResponseEntity<String> createActualite() { return ResponseEntity.ok("TODO"); }

    @PutMapping("/actualites/{id}")
    public ResponseEntity<String> updateActualite(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @DeleteMapping("/actualites/{id}")
    public ResponseEntity<String> deleteActualite(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @GetMapping("/bureaux")
    public ResponseEntity<String> getBureaux() { return ResponseEntity.ok("TODO"); }

    @PostMapping("/bureaux")
    public ResponseEntity<String> createBureau() { return ResponseEntity.ok("TODO"); }

    @PutMapping("/bureaux/{id}")
    public ResponseEntity<String> updateBureau(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @DeleteMapping("/bureaux/{id}")
    public ResponseEntity<String> deleteBureau(@PathVariable Long id) { return ResponseEntity.ok("TODO " + id); }

    @GetMapping("/rapports")
    public ResponseEntity<String> getRapports() { return ResponseEntity.ok("TODO"); }
}
