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
@Table(name = "mediateurs")
public class Mediateur extends Utilisateur {

    @Column(name = "identifiant_institution")
    private String identifiantInstitution;

    @Column(name = "institution_nom")
    private String institutionNom;
}
