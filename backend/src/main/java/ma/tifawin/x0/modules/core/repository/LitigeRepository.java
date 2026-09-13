package ma.tifawin.x0.modules.core.repository;

import java.util.Collection;
import java.util.Optional;

import ma.tifawin.x0.common.enums.LitigeStatut;
import ma.tifawin.x0.modules.core.entity.Litige;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LitigeRepository extends JpaRepository<Litige, Long> {
    long countByMediateur_IdAndStatutIn(Long mediateurId, Collection<LitigeStatut> statuts);
    Optional<Litige> findByNumeroLitige(String numeroLitige);
}
