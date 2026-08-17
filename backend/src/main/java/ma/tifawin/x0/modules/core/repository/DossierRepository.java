package ma.tifawin.x0.modules.core.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ma.tifawin.x0.modules.core.entity.Dossier;

public interface DossierRepository extends JpaRepository<Dossier, Long> {
    Optional<Dossier> findByNumeroDossier(String numeroDossier);
    List<Dossier> findByCitoyen_Id(Long citoyenId);
}
