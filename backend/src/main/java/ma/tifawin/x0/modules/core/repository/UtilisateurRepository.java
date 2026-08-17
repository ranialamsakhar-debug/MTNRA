package ma.tifawin.x0.modules.core.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import ma.tifawin.x0.modules.core.entity.Utilisateur;

public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByEmail(String email);
}
