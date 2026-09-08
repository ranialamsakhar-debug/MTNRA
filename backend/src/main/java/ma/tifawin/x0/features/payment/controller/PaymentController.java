package ma.tifawin.x0.features.payment.controller;

import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.features.payment.dto.CreatePaymentIntentRequest;
import ma.tifawin.x0.features.payment.dto.PaymentConfirmationRequest;
import ma.tifawin.x0.features.payment.dto.TarifDemandeDto;
import ma.tifawin.x0.features.payment.service.StripePaymentService;
import ma.tifawin.x0.modules.core.entity.Paiement;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/features/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final StripePaymentService stripePaymentService;

    @GetMapping("/tarifs")
    public ResponseEntity<List<TarifDemandeDto>> getCatalogueTarifs() {
        return ResponseEntity.ok(stripePaymentService.getCatalogueTarifs());
    }

    @GetMapping("/tarifs/{code}")
    public ResponseEntity<TarifDemandeDto> getTarifParCode(@PathVariable String code) {
        return ResponseEntity.ok(stripePaymentService.getTarif(code));
    }

    @PostMapping("/init")
    public ResponseEntity<Map<String, Object>> initialiserPaiement(
            @RequestBody CreatePaymentIntentRequest request) {
        return ResponseEntity.ok(
                stripePaymentService.initialiserPaiement(
                        request.getDossierId(),
                        request.getTypeDemandeCode(),
                        request.getCitoyenCin()));
    }

    @PostMapping("/confirm")
    public ResponseEntity<Paiement> confirmerPaiement(
            @RequestBody PaymentConfirmationRequest request) {
        return ResponseEntity.ok(stripePaymentService.confirmerPaiement(request));
    }

    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<Paiement> getPaiementDossier(@PathVariable Long dossierId) {
        return stripePaymentService.getPaiement(dossierId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
