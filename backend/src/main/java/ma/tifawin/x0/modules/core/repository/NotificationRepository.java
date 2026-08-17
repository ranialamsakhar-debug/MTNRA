package ma.tifawin.x0.modules.core.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import ma.tifawin.x0.modules.core.entity.Notification;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByDestinataireIdOrderByDateEnvoiDesc(Long destinataireId);
}
