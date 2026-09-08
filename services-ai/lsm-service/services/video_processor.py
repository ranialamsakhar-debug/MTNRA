import os
import tempfile
from typing import Tuple, List, Optional
import cv2
import numpy as np
import torch
import logging

logger = logging.getLogger(__name__)


class VideoProcessor:
    """
    Module de prétraitement vidéo et d'extraction de landmarks MediaPipe pour la LSM :
    1. Découpage temporel des trames vidéo (uniform sampling)
    2. Extraction des points clés anatomiques (Mains droite/gauche + Posture) via MediaPipe
    3. Normalisation et conversion en tenseurs PyTorch (B, T, C, H, W) et (B, T, L)
    """

    def __init__(
        self,
        target_frames: int = 32,
        img_size: int = 224,
        use_mediapipe: bool = True,
    ):
        self.target_frames = target_frames
        self.img_size = img_size
        self.use_mediapipe = use_mediapipe
        self.mp_holistic = None

        if use_mediapipe:
            try:
                import mediapipe as mp
                self.mp_holistic = mp.solutions.holistic.Holistic(
                    static_image_mode=False,
                    model_complexity=1,
                    smooth_landmarks=True,
                    min_detection_confidence=0.5,
                    min_tracking_confidence=0.5,
                )
            except Exception as e:
                logger.warning(f"MediaPipe non disponible ({e}). Mode vision directe actif.")

    def process_video_bytes(
        self, video_bytes: bytes, suffix: str = ".webm"
    ) -> Tuple[torch.Tensor, torch.Tensor, float]:
        """
        Prend des bytes vidéo, écrit temporairement, extrait les trames et landmarks.
        Returns:
            frames_tensor: (1, T, 3, 224, 224)
            landmarks_tensor: (1, T, 225)
            fps: Fréquence d'images de la vidéo
        """
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        try:
            frames, landmarks, fps = self._extract_from_file(tmp_path)
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass

        # Convertir en tenseurs PyTorch
        # frames: (T, H, W, 3) -> (1, T, 3, H, W)
        frames_np = np.stack(frames, axis=0)  # (T, H, W, 3)
        frames_np = frames_np.transpose(0, 3, 1, 2)  # (T, 3, H, W)
        frames_tensor = torch.from_numpy(frames_np).float().unsqueeze(0) / 255.0  # (1, T, 3, H, W)

        # Standardisation ImageNet
        mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 1, 3, 1, 1)
        std = torch.tensor([0.229, 0.224, 0.225]).view(1, 1, 3, 1, 1)
        frames_tensor = (frames_tensor - mean) / std

        # landmarks: (T, L) -> (1, T, L)
        landmarks_np = np.stack(landmarks, axis=0)  # (T, 225)
        landmarks_tensor = torch.from_numpy(landmarks_np).float().unsqueeze(0)

        return frames_tensor, landmarks_tensor, fps

    def _extract_from_file(
        self, video_path: str
    ) -> Tuple[List[np.ndarray], List[np.ndarray], float]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Impossible d'ouvrir le flux vidéo fourni.")

        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        raw_frames = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            raw_frames.append(frame)
        cap.release()

        if not raw_frames:
            raise ValueError("La vidéo ne contient aucune trame lisible.")

        # Échantillonnage temporel uniforme vers `target_frames`
        indices = np.linspace(0, len(raw_frames) - 1, self.target_frames, dtype=int)
        sampled_frames = [raw_frames[i] for i in indices]

        processed_frames = []
        extracted_landmarks = []

        for frame in sampled_frames:
            # Conversion BGR -> RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            # Redimensionnement spatial (224, 224)
            resized = cv2.resize(rgb_frame, (self.img_size, self.img_size))
            processed_frames.append(resized)

            # Extraction MediaPipe
            landmarks_vector = self._extract_landmarks(rgb_frame)
            extracted_landmarks.append(landmarks_vector)

        return processed_frames, extracted_landmarks, fps

    def _extract_landmarks(self, rgb_image: np.ndarray) -> np.ndarray:
        """
        Extrait les 21 points de la main gauche, 21 points de la main droite,
        et les points clés de la posture (épaules, coudes, poignets, nez).
        Vecteur résultant : (21*3 + 21*3 + 33*3) = (63 + 63 + 99) = 225 valeurs
        """
        # Vecteur de zéros par défaut si aucun corps/main n'est détecté
        vec = np.zeros(225, dtype=np.float32)

        if not self.mp_holistic:
            return vec

        try:
            results = self.mp_holistic.process(rgb_image)

            offset = 0
            # 1. Main Gauche (21 points x 3 = 63)
            if results.left_hand_landmarks:
                for lm in results.left_hand_landmarks.landmark:
                    vec[offset : offset + 3] = [lm.x, lm.y, lm.z]
                    offset += 3
            else:
                offset += 63

            # 2. Main Droite (21 points x 3 = 63)
            if results.right_hand_landmarks:
                for lm in results.right_hand_landmarks.landmark:
                    vec[offset : offset + 3] = [lm.x, lm.y, lm.z]
                    offset += 3
            else:
                offset += 63

            # 3. Posture / Pose (33 points x 3 = 99)
            if results.pose_landmarks:
                for lm in results.pose_landmarks.landmark:
                    vec[offset : offset + 3] = [lm.x, lm.y, lm.z]
                    offset += 3

        except Exception:
            pass

        return vec
