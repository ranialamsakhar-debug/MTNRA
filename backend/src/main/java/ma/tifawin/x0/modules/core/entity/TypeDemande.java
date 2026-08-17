package ma.tifawin.x0.modules.core.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "type_demandes")
public class TypeDemande {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String libelle;

    @Column(length = 3000)
    private String description;

    @Column(name = "workflow_json", columnDefinition = "TEXT")
    private String workflow;

    @Column(name = "duree_traitement_jours")
    private Integer dureeTraitementJours;

    @Column(nullable = false)
    private Boolean actif = true;
}
