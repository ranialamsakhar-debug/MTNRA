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
@Table(name = "signatures_simples")
public class SignatureSimple extends Signature {

    @Column(nullable = false)
    private String imageSignature;

    private String ipAdresse;

    private String userAgent;

    @Column(nullable = false)
    private Boolean reAuthentifie = false;
}
