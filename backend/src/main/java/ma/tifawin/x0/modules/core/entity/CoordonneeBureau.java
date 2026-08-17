package ma.tifawin.x0.modules.core.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "coordonnees_bureaux")
public class CoordonneeBureau {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomBureau;

    private String adresse;

    private String ville;

    private String codePostal;

    private String telephone;

    private String email;

    private Double latitude;

    private Double longitude;

    private String horaires;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceEntity service;
}
