package ma.tifawin.x0.modules.core.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "signatures_qualifiees")
public class SignatureQualifiee extends Signature {

    @Column(nullable = false)
    private String idCertificat;

    private String autoriteCertification;

    private String horodatageCertifie;

    @Column(nullable = false)
    private Boolean certificatValide = false;
}
