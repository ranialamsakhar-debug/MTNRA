package ma.tifawin.x0.modules.core.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ma.tifawin.x0.modules.core.entity.RendezVous;

public interface RendezVousRepository extends JpaRepository<RendezVous, Long> {
    List<RendezVous> findByCitoyenId(Long citoyenId);
}
