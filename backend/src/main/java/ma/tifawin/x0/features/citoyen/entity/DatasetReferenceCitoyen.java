package ma.tifawin.x0.features.citoyen.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "dataset_reference_citoyens")
public class DatasetReferenceCitoyen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String cni;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(name = "date_naissance", nullable = false)
    private LocalDate dateNaissance;

    @Column(nullable = false)
    private Boolean compteCree = false;
}
