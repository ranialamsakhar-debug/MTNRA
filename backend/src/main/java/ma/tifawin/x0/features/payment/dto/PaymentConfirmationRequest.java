package ma.tifawin.x0.features.payment.dto;

import lombok.Data;

@Data
public class PaymentConfirmationRequest {
    private Long dossierId;
    private String paymentIntentId;
    private String moyenPaiement; // "STRIPE_CARD", "APPLE_PAY", "GOOGLE_PAY"
    private String carteLast4;
    private String carteMarque;
}
