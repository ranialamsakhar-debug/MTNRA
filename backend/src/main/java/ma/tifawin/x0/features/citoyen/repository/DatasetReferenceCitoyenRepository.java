package ma.tifawin.x0.features.citoyen.repository;

import ma.tifawin.x0.features.citoyen.entity.DatasetReferenceCitoyen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DatasetReferenceCitoyenRepository extends JpaRepository<DatasetReferenceCitoyen, Long> {
    Optional<DatasetReferenceCitoyen> findByCni(String cni);
}
