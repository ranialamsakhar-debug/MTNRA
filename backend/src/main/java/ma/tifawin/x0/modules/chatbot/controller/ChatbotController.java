package ma.tifawin.x0.modules.chatbot.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

    @PostMapping("/query")
    public ResponseEntity<String> query() {
        return ResponseEntity.ok("TODO chatbot query");
    }
}
