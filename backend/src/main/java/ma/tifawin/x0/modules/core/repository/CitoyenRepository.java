package ma.tifawin.x0.modules.core.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ma.tifawin.x0.modules.core.entity.Citoyen;

public interface CitoyenRepository extends JpaRepository<Citoyen, Long> {
    Optional<Citoyen> findByCin(String cin);
}
