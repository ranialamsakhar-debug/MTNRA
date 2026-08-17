package ma.tifawin.x0.modules.core.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "administrateurs")
public class Administrateur extends Agent {
}
