package ma.tifawin.x0.features.payment.dto;

import lombok.Data;

@Data
public class CreatePaymentIntentRequest {
    private Long dossierId;
    private String typeDemandeCode;
    private String citoyenCin;
    private String currency = "mad";
}
