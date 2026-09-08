package ma.tifawin.x0.features.payment.dto;

import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TarifDemandeDto {
    private String code;
    private String libelle;
    private BigDecimal montant;
    private String devise;
    private boolean estPayant;
    private String delaiTraitement;
    private String description;
}
