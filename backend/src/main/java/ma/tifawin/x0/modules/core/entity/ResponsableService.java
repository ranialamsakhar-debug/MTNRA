package ma.tifawin.x0.modules.core.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "responsables_service")
public class ResponsableService extends Agent {

    @Column(name = "service_represente")
    private String serviceRepresente;

    @OneToMany(mappedBy = "superviseur")
    private List<Agent> agentsSupervises = new ArrayList<>();
}
