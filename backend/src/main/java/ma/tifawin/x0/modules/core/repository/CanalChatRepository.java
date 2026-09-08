package ma.tifawin.x0.modules.core.repository;

import java.util.List;
import java.util.Optional;

import ma.tifawin.x0.common.enums.CanalType;
import ma.tifawin.x0.modules.core.entity.Agent;
import ma.tifawin.x0.modules.core.entity.CanalChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CanalChatRepository extends JpaRepository<CanalChat, Long> {

    List<CanalChat> findByType(CanalType type);

    List<CanalChat> findByDepartement(String departement);

    @Query("SELECT c FROM CanalChat c JOIN c.membres m WHERE m = :agent OR c.type = 'GROUPE_DEPARTEMENT'")
    List<CanalChat> findCanauxForAgent(@Param("agent") Agent agent);

    @Query("SELECT c FROM CanalChat c WHERE c.type = 'PRIVE_DIRECT' AND :agent1 MEMBER OF c.membres AND :agent2 MEMBER OF c.membres")
    Optional<CanalChat> findDirectChannelBetween(@Param("agent1") Agent agent1, @Param("agent2") Agent agent2);
}
