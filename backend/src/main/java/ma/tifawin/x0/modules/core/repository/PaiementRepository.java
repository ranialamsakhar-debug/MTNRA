package ma.tifawin.x0.modules.core.repository;

import java.util.Optional;

import ma.tifawin.x0.modules.core.entity.Dossier;
import ma.tifawin.x0.modules.core.entity.Paiement;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaiementRepository extends JpaRepository<Paiement, Long> {
    Optional<Paiement> findByDossier(Dossier dossier);
    Optional<Paiement> findByNumeroTransaction(String numeroTransaction);
    Optional<Paiement> findByStripePaymentIntentId(String stripePaymentIntentId);
}
