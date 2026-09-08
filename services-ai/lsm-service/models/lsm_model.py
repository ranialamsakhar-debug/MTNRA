import os
import logging
import torch
import torch.nn as nn
try:
    import torchvision.models as models
    HAS_TORCHVISION = True
except ImportError:
    models = None
    HAS_TORCHVISION = False
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

class SpatialFeatureExtractor(nn.Module):
    """
    Extracteur de caractéristiques spatiales basé sur ResNet-18 ou ConvNet PyTorch.
    Prend en entrée des trames vidéo (B, C, H, W) et produit des vecteurs de features (B, feature_dim).
    """

    def __init__(self, pretrained: bool = False, feature_dim: int = 512):
        super().__init__()
        if HAS_TORCHVISION and models is not None:
            weights = models.ResNet18_Weights.DEFAULT if pretrained else None
            resnet = models.resnet18(weights=weights)
            self.backbone = nn.Sequential(*list(resnet.children())[:-1])
        else:
            self.backbone = nn.Sequential(
                nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False),
                nn.BatchNorm2d(64),
                nn.ReLU(inplace=True),
                nn.AdaptiveAvgPool2d((1, 1))
            )
            feature_dim = 64
        self.flatten = nn.Flatten()
        self.feature_dim = feature_dim

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.backbone(x)
        return self.flatten(features)


class LandmarkFeatureExtractor(nn.Module):
    """
    Encodeur pour les points clés anatomiques extraits par MediaPipe (mains et posture).
    Landmarks shape: (B, num_landmarks * coordinates) -> ex: (B, 75 * 3) = (B, 225)
    """

    def __init__(self, input_dim: int = 225, hidden_dim: int = 256, output_dim: int = 256):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(inplace=True),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, output_dim),
            nn.ReLU(inplace=True),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.mlp(x)


class LSMResNetBiLSTMCTC(nn.Module):
    """
    Architecture hybride complète pour la reconnaissance de la Langue des Signes (LSM) :
    1. ResNet-18 (Features visuelles des trames)
    2. Encodeur MediaPipe (Features spatiotemporelles des points clés)
    3. BiLSTM (Modélisation temporelle bidirectionnelle de la dynamique du geste)
    4. Couche de projection CTC (Logits par trame pour décodage CTC)
    """

    def __init__(
        self,
        num_classes: int,
        resnet_feature_dim: int = 512,
        landmark_dim: int = 225,
        landmark_feat_dim: int = 256,
        lstm_hidden_dim: int = 256,
        lstm_num_layers: int = 2,
        dropout: float = 0.3,
        use_visual: bool = True,
        use_landmarks: bool = True,
    ):
        super().__init__()
        self.num_classes = num_classes
        self.use_visual = use_visual
        self.use_landmarks = use_landmarks

        total_feature_dim = 0
        if use_visual:
            self.visual_extractor = SpatialFeatureExtractor(pretrained=False, feature_dim=resnet_feature_dim)
            total_feature_dim += resnet_feature_dim

        if use_landmarks:
            self.landmark_extractor = LandmarkFeatureExtractor(
                input_dim=landmark_dim, output_dim=landmark_feat_dim
            )
            total_feature_dim += landmark_feat_dim

        # Couche de fusion adaptative
        self.fusion = nn.Sequential(
            nn.Linear(total_feature_dim, 512),
            nn.LayerNorm(512),
            nn.ReLU(inplace=True),
            nn.Dropout(dropout),
        )

        # Modélisation Temporelle Bidirectionnelle (BiLSTM)
        self.bilstm = nn.LSTM(
            input_size=512,
            hidden_size=lstm_hidden_dim,
            num_layers=lstm_num_layers,
            batch_first=True,
            bidirectional=True,
            dropout=dropout if lstm_num_layers > 1 else 0.0,
        )

        # Couche linéaire finale de classification (Projection vers Vocabulaire + Token CTC Blank)
        # BiLSTM bidirectionnel = hidden_dim * 2
        self.classifier = nn.Linear(lstm_hidden_dim * 2, num_classes)

        # Fonction de log-softmax pour le décodage CTC
        self.log_softmax = nn.LogSoftmax(dim=-1)

    def forward(
        self,
        frames: Optional[torch.Tensor] = None,
        landmarks: Optional[torch.Tensor] = None,
    ) -> torch.Tensor:
        """
        Args:
            frames: (B, T, C, H, W) - Tenseur de trames vidéo
            landmarks: (B, T, landmark_dim) - Tenseur des points de repère MediaPipe
        Returns:
            log_probs: (B, T, num_classes) - Log-probabilités par trame prêtes pour CTC Loss / Decoder
        """
        feature_list = []

        if self.use_visual and frames is not None:
            B, T, C, H, W = frames.shape
            # Aplatir le temps dans le batch pour ResNet
            frames_flat = frames.view(B * T, C, H, W)
            visual_features = self.visual_extractor(frames_flat)  # (B*T, 512)
            visual_features = visual_features.view(B, T, -1)  # (B, T, 512)
            feature_list.append(visual_features)

        if self.use_landmarks and landmarks is not None:
            B, T, L = landmarks.shape
            landmarks_flat = landmarks.view(B * T, L)
            landmark_features = self.landmark_extractor(landmarks_flat)  # (B*T, 256)
            landmark_features = landmark_features.view(B, T, -1)  # (B, T, 256)
            feature_list.append(landmark_features)

        if not feature_list:
            raise ValueError("Au moins frames ou landmarks doivent être fournis au modèle.")

        # Concaténation des caractéristiques
        if len(feature_list) == 1:
            combined = feature_list[0]
        else:
            combined = torch.cat(feature_list, dim=-1)  # (B, T, total_dim)

        # Projection de fusion
        fused = self.fusion(combined)  # (B, T, 512)

        # Passage dans le BiLSTM temporel
        lstm_out, _ = self.bilstm(fused)  # (B, T, lstm_hidden_dim * 2)

        # Logits de classification
        logits = self.classifier(lstm_out)  # (B, T, num_classes)

        # Log-Softmax pour CTC
        log_probs = self.log_softmax(logits)  # (B, T, num_classes)

        return log_probs


def load_lsm_model(
    num_classes: int,
    checkpoint_path: Optional[str] = None,
    device: str = "cpu",
) -> LSMResNetBiLSTMCTC:
    """
    Instancie et charge le modèle LSM (ResNet + BiLSTM + CTC).
    """
    model = LSMResNetBiLSTMCTC(num_classes=num_classes)
    if checkpoint_path and os.path.exists(checkpoint_path):
        state_dict = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(state_dict)
        logger.info(f"Poids du modèle LSM chargés depuis {checkpoint_path}")
    else:
        logger.info("Modèle LSM initialisé (mode inférence prêt).")

    model.to(device)
    model.eval()
    return model
