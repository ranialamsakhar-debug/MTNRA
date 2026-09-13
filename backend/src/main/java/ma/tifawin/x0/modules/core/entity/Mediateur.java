package ma.tifawin.x0.modules.core.entity;

import java.time.LocalDate;

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

    private LocalDate dateDisponibiliteDebut;

    private LocalDate dateDisponibiliteFin;

    @Column(length = 20)
    private String joursDisponibles = "1,2,3,4,5";
}
