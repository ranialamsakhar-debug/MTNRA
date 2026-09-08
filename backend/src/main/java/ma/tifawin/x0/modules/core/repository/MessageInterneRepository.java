package ma.tifawin.x0.modules.core.repository;

import java.util.List;

import ma.tifawin.x0.modules.core.entity.CanalChat;
import ma.tifawin.x0.modules.core.entity.MessageInterne;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageInterneRepository extends JpaRepository<MessageInterne, Long> {
    List<MessageInterne> findByCanalOrderByDateEnvoiAsc(CanalChat canal);
    long countByCanalAndLuFalse(CanalChat canal);
}
