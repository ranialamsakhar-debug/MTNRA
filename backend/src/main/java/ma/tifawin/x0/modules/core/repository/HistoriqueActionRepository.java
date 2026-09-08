package ma.tifawin.x0.modules.core.repository;

import java.util.List;

import ma.tifawin.x0.modules.core.entity.Dossier;
import ma.tifawin.x0.modules.core.entity.HistoriqueAction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HistoriqueActionRepository extends JpaRepository<HistoriqueAction, Long> {
    List<HistoriqueAction> findByDossierOrderByDateHeureDesc(Dossier dossier);
}
