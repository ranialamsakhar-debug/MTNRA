package ma.tifawin.x0.features.chat.controller;

import java.util.List;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.tifawin.x0.features.chat.dto.*;
import ma.tifawin.x0.features.chat.service.InternalChatService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/features/chat")
@RequiredArgsConstructor
public class InternalChatController {

    private final InternalChatService internalChatService;

    @GetMapping("/canaux")
    public ResponseEntity<List<CanalResponse>> getCanaux(
            @RequestParam(required = false, defaultValue = "1") Long agentId) {
        return ResponseEntity.ok(internalChatService.getCanauxPourAgent(agentId));
    }

    @PostMapping("/canaux")
    public ResponseEntity<CanalResponse> creerCanal(
            @Valid @RequestBody CreateCanalRequest request) {
        return ResponseEntity.ok(internalChatService.creerCanal(request));
    }

    @PostMapping("/prive")
    public ResponseEntity<CanalResponse> ouvrirChatPrive(
            @RequestParam Long agentId1,
            @RequestParam Long agentId2) {
        return ResponseEntity.ok(internalChatService.ouvrirOuCreerChatPrive(agentId1, agentId2));
    }

    @GetMapping("/canaux/{canalId}/messages")
    public ResponseEntity<List<MessageResponse>> getMessages(
            @PathVariable Long canalId) {
        return ResponseEntity.ok(internalChatService.getMessagesCanal(canalId));
    }

    @PostMapping("/messages")
    public ResponseEntity<MessageResponse> envoyerMessage(
            @Valid @RequestBody SendMessageRequest request) {
        return ResponseEntity.ok(internalChatService.envoyerMessage(request));
    }

    @GetMapping("/agents")
    public ResponseEntity<List<AgentSummaryDto>> getTousLesAgents() {
        return ResponseEntity.ok(internalChatService.getTousLesAgents());
    }
}
