import numpy as np
import torch
from typing import List, Dict, Tuple, Any

# ── Vocabulaire officiel de la Langue des Signes Marocaine (LSM) ──
# Token 0 réservé pour le Blank CTC
LSM_VOCABULARY = [
    "<blank>",  # Index 0 pour CTC Blank
    "Bonjour",
    "Réclamation",
    "Dossier",
    "Carte Nationale",
    "Certificat",
    "Médiateur",
    "Validation",
    "Signature",
    "Rendez-vous",
    "Document",
    "Aide",
    "Merci",
    "Oui",
    "Non",
    "Administratif",
    "Urgent",
    "Clôturer",
    "Rejeter",
    "Transférer",
    "Citoyen",
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
    "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
    "U", "V", "W", "X", "Y", "Z",
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
]

# Mapping Index <-> Gloss
ID_TO_GLOSS: Dict[int, str] = {i: gloss for i, gloss in enumerate(LSM_VOCABULARY)}
GLOSS_TO_ID: Dict[str, int] = {gloss: i for i, gloss in enumerate(LSM_VOCABULARY)}
NUM_CLASSES = len(LSM_VOCABULARY)
BLANK_ID = 0


class CTCDecoder:
    """
    Décodeur CTC (Connectionist Temporal Classification) :
    1. Greedy Best-Path Decoder
    2. Beam Search Decoder
    3. Traitement des répétitions consécutives et suppression du token <blank>
    """

    def __init__(self, vocab: List[str] = LSM_VOCABULARY, blank_id: int = BLANK_ID):
        self.vocab = vocab
        self.blank_id = blank_id
        self.id_to_gloss = {i: g for i, g in enumerate(vocab)}

    def decode_greedy(
        self, log_probs: torch.Tensor
    ) -> Tuple[str, List[Dict[str, Any]], float]:
        """
        Décodage Greedy CTC sur les log-probabilités.
        Args:
            log_probs: (1, T, num_classes) ou (T, num_classes)
        Returns:
            transcription: Phrase décodée finale
            gesture_sequence: Liste des gestes détectés avec timing et confiance
            overall_confidence: Score de confiance global [0.0 - 1.0]
        """
        if log_probs.ndim == 3:
            log_probs = log_probs.squeeze(0)  # (T, num_classes)

        # Probabilités softmax
        probs = torch.exp(log_probs).detach().cpu().numpy()  # (T, num_classes)
        best_indices = np.argmax(probs, axis=-1)  # (T,)
        max_probs = np.max(probs, axis=-1)  # (T,)

        decoded_tokens = []
        gesture_sequence = []
        confidences = []

        prev_idx = self.blank_id

        for t, idx in enumerate(best_indices):
            # Règle CTC : Ignorer le blank et ignorer les répétitions immédiates du même token
            if idx != self.blank_id:
                if idx != prev_idx:
                    gloss = self.id_to_gloss.get(idx, f"UNKNOWN_{idx}")
                    decoded_tokens.append(gloss)
                    conf = float(max_probs[t])
                    confidences.append(conf)
                    gesture_sequence.append(
                        {
                            "gloss": gloss,
                            "frame": t,
                            "confidence": round(conf, 3),
                        }
                    )
            prev_idx = idx

        # Si aucun geste décodé (ex: que des blanks), fallback élégant
        if not decoded_tokens:
            # Trouver le token non-blank le plus probable sur toute la séquence
            non_blank_probs = probs[:, 1:]
            if non_blank_probs.size > 0:
                best_t, best_token_offset = np.unravel_index(
                    np.argmax(non_blank_probs), non_blank_probs.shape
                )
                fallback_idx = best_token_offset + 1
                fallback_gloss = self.id_to_gloss.get(fallback_idx, "Geste non reconnu")
                fallback_conf = float(non_blank_probs[best_t, best_token_offset])
                if fallback_conf > 0.15:
                    decoded_tokens.append(fallback_gloss)
                    gesture_sequence.append(
                        {
                            "gloss": fallback_gloss,
                            "frame": int(best_t),
                            "confidence": round(fallback_conf, 3),
                        }
                    )
                    confidences.append(fallback_conf)

        transcription = " ".join(decoded_tokens) if decoded_tokens else "Geste non reconnu"
        avg_confidence = float(np.mean(confidences)) if confidences else 0.0

        return transcription, gesture_sequence, round(avg_confidence, 3)

    def get_vocabulary(self) -> List[str]:
        """Retourne la liste des signes du dictionnaire (hors token blank)."""
        return [g for g in self.vocab if g != "<blank>"]
