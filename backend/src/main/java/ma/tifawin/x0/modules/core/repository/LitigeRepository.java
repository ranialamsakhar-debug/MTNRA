package ma.tifawin.x0.modules.core.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ma.tifawin.x0.modules.core.entity.Litige;

public interface LitigeRepository extends JpaRepository<Litige, Long> {
    Optional<Litige> findByNumeroLitige(String numeroLitige);
}
