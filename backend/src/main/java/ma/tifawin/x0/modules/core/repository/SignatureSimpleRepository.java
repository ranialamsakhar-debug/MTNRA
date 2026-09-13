package ma.tifawin.x0.modules.core.repository;

import ma.tifawin.x0.modules.core.entity.SignatureSimple;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SignatureSimpleRepository extends JpaRepository<SignatureSimple, Long> {
    boolean existsByDossier_IdDossier(Long dossierId);
}
