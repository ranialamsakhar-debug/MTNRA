package ma.tifawin.x0.features.chat.service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.tifawin.x0.common.enums.CanalType;
import ma.tifawin.x0.features.chat.dto.*;
import ma.tifawin.x0.modules.core.entity.Agent;
import ma.tifawin.x0.modules.core.entity.CanalChat;
import ma.tifawin.x0.modules.core.entity.MessageInterne;
import ma.tifawin.x0.modules.core.repository.CanalChatRepository;
import ma.tifawin.x0.modules.core.repository.MessageInterneRepository;
import ma.tifawin.x0.modules.core.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class InternalChatService {

    private final CanalChatRepository canalChatRepository;
    private final MessageInterneRepository messageInterneRepository;
    private final UtilisateurRepository utilisateurRepository;

    @PostConstruct
    @Transactional
    public void initialiserCanauxParDefaut() {
        if (canalChatRepository.count() == 0) {
            log.info("📢 Initialisation des canaux de discussion départementaux par défaut...");

            creerCanalSysteme("🏢 Service Réclamations", "Canal de coordination pour l'instruction et la qualification des réclamations.", CanalType.GROUPE_DEPARTEMENT, "RECLAMATION");
            creerCanalSysteme("🔍 Service Validation & Conformité", "Canal d'échange pour l'examen de conformité des dossiers.", CanalType.GROUPE_DEPARTEMENT, "VALIDATION");
            creerCanalSysteme("📜 Service Certification & Attestation", "Canal pour l'attestation et la vérification des pièces certifiées.", CanalType.GROUPE_DEPARTEMENT, "CERTIFICATION");
            creerCanalSysteme("✍️ Service Signature Officielle", "Canal des signataires habilités et suivi de clôture.", CanalType.GROUPE_DEPARTEMENT, "SIGNATURE");
            creerCanalSysteme("⚖️ Pôle Médiation du Royaume", "Canal dédié à l'instruction des litiges et recommandations amiables.", CanalType.GROUPE_DEPARTEMENT, "MEDIATION");
            creerCanalSysteme("🏛️ Coordination Inter-Services", "Canal transversal pour le traitement des cas complexes et concertations.", CanalType.GROUPE_INTER_DEPARTEMENT, "GENERAL");

            log.info("✅ 6 canaux de discussion officiels créés.");
        }
    }

    private void creerCanalSysteme(String nom, String desc, CanalType type, String dept) {
        CanalChat c = new CanalChat();
        c.setNom(nom);
        c.setDescription(desc);
        c.setType(type);
        c.setDepartement(dept);
        c.setDateCreation(LocalDateTime.now());
        canalChatRepository.save(c);
    }

    // ── 1. Récupération des Canaux ──────────────────────

    @Transactional(readOnly = true)
    public List<CanalResponse> getCanauxPourAgent(Long agentId) {
        List<CanalChat> tousCanaux = canalChatRepository.findAll();

        return tousCanaux.stream().map(canal -> {
            List<MessageInterne> msgs = messageInterneRepository.findByCanalOrderByDateEnvoiAsc(canal);
            MessageResponse dernierMsg = null;
            if (!msgs.isEmpty()) {
                MessageInterne last = msgs.get(msgs.size() - 1);
                dernierMsg = mapToMessageResponse(last);
            }

            long nonLus = messageInterneRepository.countByCanalAndLuFalse(canal);

            List<AgentSummaryDto> membresDto = canal.getMembres().stream()
                    .map(this::mapToAgentSummary)
                    .collect(Collectors.toList());

            return new CanalResponse(
                    canal.getIdCanal(),
                    canal.getNom(),
                    canal.getDescription(),
                    canal.getType(),
                    canal.getDepartement(),
                    canal.getDateCreation(),
                    canal.getMembres().size(),
                    membresDto,
                    dernierMsg,
                    nonLus
            );
        }).collect(Collectors.toList());
    }

    // ── 2. Création de Groupe / Canal ───────────────────

    @Transactional
    public CanalResponse creerCanal(CreateCanalRequest request) {
        CanalChat canal = new CanalChat();
        canal.setNom(request.getNom());
        canal.setDescription(request.getDescription());
        canal.setType(request.getType());
        canal.setDepartement(request.getDepartement());
        canal.setDateCreation(LocalDateTime.now());

        if (request.getMembreAgentIds() != null && !request.getMembreAgentIds().isEmpty()) {
            Set<Agent> agents = request.getMembreAgentIds().stream()
                    .map(id -> utilisateurRepository.findById(id).orElse(null))
                    .filter(u -> u instanceof Agent)
                    .map(u -> (Agent) u)
                    .collect(Collectors.toSet());
            canal.setMembres(agents);
        }

        CanalChat saved = canalChatRepository.save(canal);
        return new CanalResponse(
                saved.getIdCanal(),
                saved.getNom(),
                saved.getDescription(),
                saved.getType(),
                saved.getDepartement(),
                saved.getDateCreation(),
                saved.getMembres().size(),
                Collections.emptyList(),
                null,
                0
        );
    }

    // ── 3. Chat Privé 1-à-1 Direct ──────────────────────

    @Transactional
    public CanalResponse ouvrirOuCreerChatPrive(Long agentId1, Long agentId2) {
        Agent a1 = (Agent) utilisateurRepository.findById(agentId1)
                .orElseThrow(() -> new RuntimeException("Agent 1 introuvable"));
        Agent a2 = (Agent) utilisateurRepository.findById(agentId2)
                .orElseThrow(() -> new RuntimeException("Agent 2 introuvable"));

        Optional<CanalChat> existant = canalChatRepository.findDirectChannelBetween(a1, a2);
        if (existant.isPresent()) {
            CanalChat c = existant.get();
            return new CanalResponse(
                    c.getIdCanal(),
                    c.getNom(),
                    c.getDescription(),
                    c.getType(),
                    c.getDepartement(),
                    c.getDateCreation(),
                    2,
                    List.of(mapToAgentSummary(a1), mapToAgentSummary(a2)),
                    null,
                    0
            );
        }

        CanalChat prive = new CanalChat();
        prive.setNom("💬 " + a1.getPrenom() + " " + a1.getNom() + " & " + a2.getPrenom() + " " + a2.getNom());
        prive.setDescription("Conversation privée directe");
        prive.setType(CanalType.PRIVE_DIRECT);
        prive.setDateCreation(LocalDateTime.now());
        prive.setMembres(new HashSet<>(Arrays.asList(a1, a2)));

        CanalChat saved = canalChatRepository.save(prive);
        return new CanalResponse(
                saved.getIdCanal(),
                saved.getNom(),
                saved.getDescription(),
                saved.getType(),
                saved.getDepartement(),
                saved.getDateCreation(),
                2,
                List.of(mapToAgentSummary(a1), mapToAgentSummary(a2)),
                null,
                0
        );
    }

    // ── 4. Envoi de Message ─────────────────────────────

    @Transactional
    public MessageResponse envoyerMessage(SendMessageRequest request) {
        CanalChat canal = canalChatRepository.findById(request.getCanalId())
                .orElseThrow(() -> new RuntimeException("Canal introuvable : " + request.getCanalId()));

        Agent expediteur = (Agent) utilisateurRepository.findById(request.getExpediteurId())
                .orElseThrow(() -> new RuntimeException("Expéditeur introuvable : " + request.getExpediteurId()));

        MessageInterne msg = new MessageInterne();
        msg.setCanal(canal);
        msg.setExpediteur(expediteur);
        msg.setContenu(request.getContenu().trim());
        msg.setDateEnvoi(LocalDateTime.now());
        msg.setLu(false);

        MessageInterne saved = messageInterneRepository.save(msg);
        return mapToMessageResponse(saved);
    }

    // ── 5. Récupération des Messages d'un Canal ─────────

    @Transactional(readOnly = true)
    public List<MessageResponse> getMessagesCanal(Long canalId) {
        CanalChat canal = canalChatRepository.findById(canalId)
                .orElseThrow(() -> new RuntimeException("Canal introuvable : " + canalId));

        return messageInterneRepository.findByCanalOrderByDateEnvoiAsc(canal).stream()
                .map(this::mapToMessageResponse)
                .collect(Collectors.toList());
    }

    // ── 6. Liste des Employés / Agents pour Chat Privé ──

    @Transactional(readOnly = true)
    public List<AgentSummaryDto> getTousLesAgents() {
        return utilisateurRepository.findAll().stream()
                .filter(u -> u instanceof Agent)
                .map(u -> mapToAgentSummary((Agent) u))
                .collect(Collectors.toList());
    }

    // ── Mappers DTO <-> Entity ─────────────────────────

    private MessageResponse mapToMessageResponse(MessageInterne msg) {
        Agent exp = msg.getExpediteur();
        return new MessageResponse(
                msg.getIdMessage(),
                msg.getCanal() != null ? msg.getCanal().getIdCanal() : null,
                exp != null ? exp.getId() : null,
                exp != null ? exp.getNom() : "Système",
                exp != null ? exp.getPrenom() : "MTNRA",
                exp != null ? exp.getServiceAffectation() : "Administration",
                msg.getContenu(),
                msg.getDateEnvoi(),
                msg.getLu()
        );
    }

    private AgentSummaryDto mapToAgentSummary(Agent agent) {
        return new AgentSummaryDto(
                agent.getId(),
                agent.getMatricule(),
                agent.getNom(),
                agent.getPrenom(),
                agent.getEmail(),
                agent.getServiceAffectation(),
                agent.getRole() != null ? agent.getRole().name() : "AGENT"
        );
    }
}
