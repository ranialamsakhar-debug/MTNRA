package ma.tifawin.x0.modules.core.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "actualites")
public class Actualite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idActualite;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false, length = 8000)
    private String contenu;

    private LocalDateTime datePublication;

    private LocalDateTime dateScraping;

    private String source;

    private String url;

    private String imageUrl;

    private String categorie;
}
