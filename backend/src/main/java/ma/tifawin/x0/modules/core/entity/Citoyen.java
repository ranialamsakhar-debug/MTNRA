package ma.tifawin.x0.modules.core.entity;

import java.time.LocalDate;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.tifawin.x0.common.enums.IndicateurAccessibilite;
import ma.tifawin.x0.common.enums.LanguePreferee;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "citoyens")
public class Citoyen extends Utilisateur {

    @Column(nullable = false, unique = true)
    private String cin;

    @Enumerated(EnumType.STRING)
    @Column(name = "langue_preferee", nullable = false)
    private LanguePreferee languePreferee = LanguePreferee.FRANCAIS;

    @Enumerated(EnumType.STRING)
    @Column(name = "indicateur_accessibilite", nullable = false)
    private IndicateurAccessibilite indicateurAccessibilite = IndicateurAccessibilite.AUCUN;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    private String adresse;

    @Column(name = "telephone_mobile")
    private String telephoneMobile;
}
