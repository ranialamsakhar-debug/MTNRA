package ma.tifawin.x0.modules.core.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "services_publics")
public class ServiceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idService;

    @Column(nullable = false, unique = true)
    private String codeService;

    @Column(nullable = false)
    private String nomService;

    @Column(length = 3000)
    private String description;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable_id")
    private ResponsableService responsable;

    private String contactPoint;

    private String telephone;

    private String adresse;

    @Column(nullable = false)
    private Boolean actif = true;
}
