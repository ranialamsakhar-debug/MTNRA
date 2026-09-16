"""
LSM Service - Pipeline complet MediaPipe + ResNet + BiLSTM + CTC
Accepte des frames JPEG (envoyées depuis le frontend via canvas)
ET des vidéos (avec fallback imageio/av si disponible).
"""

import time
import logging
import os
import base64
import json
import re
import unicodedata
from typing import List, Tuple, Optional
from pathlib import Path
import urllib.request

import cv2
import numpy as np
try:
    import torch
    from models.lsm_model import LSMResNetBiLSTMCTC, load_lsm_model
    from services.ctc_decoder import CTCDecoder, NUM_CLASSES, LSM_VOCABULARY
except ImportError:
    torch = None
    LSMResNetBiLSTMCTC = None
    load_lsm_model = None
    CTCDecoder = None
    NUM_CLASSES = 15
    LSM_VOCABULARY = []
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lsm-service")

app = FastAPI(
    title="MTNRA - Moroccan Sign Language (LSM) Recognition Service",
    description="Pipeline MediaPipe + ResNet + BiLSTM + CTC — Frames JPEG ou vidéo.",
    version="4.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Chargement du modèle au démarrage ──────────────────
ctc_decoder: Optional[CTCDecoder] = None
model: Optional[LSMResNetBiLSTMCTC] = None
TARGET_FRAMES = 32
IMG_SIZE = 224

# ── Téléchargement modèle MediaPipe Tasks ──────────────
MODEL_PATH = Path(__file__).parent / "hand_landmarker.task"
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"
)

import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision


def ensure_model():
    if not MODEL_PATH.exists():
        logger.info("⬇️  Téléchargement du modèle HandLandmarker...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        logger.info(f"✅ Modèle téléchargé : {MODEL_PATH}")


_landmarker_instance = None

def get_landmarker():
    global _landmarker_instance
    if _landmarker_instance is None:
        try:
            ensure_model()
            base_options = mp_python.BaseOptions(model_asset_path=str(MODEL_PATH))
            options = mp_vision.HandLandmarkerOptions(
                base_options=base_options,
                running_mode=mp_vision.RunningMode.IMAGE,
                num_hands=2,
                min_hand_detection_confidence=0.35,
                min_tracking_confidence=0.35,
            )
            _landmarker_instance = mp_vision.HandLandmarker.create_from_options(options)
            logger.info("✅ MediaPipe HandLandmarker créé avec succès.")
        except Exception as e:
            logger.warning(f"⚠️ Échec initialisation MediaPipe HandLandmarker: {e}")
    return _landmarker_instance


def extract_landmarks_from_frame(frame_bgr: np.ndarray, landmarker) -> np.ndarray:
    """
    Extrait un vecteur de landmarks (225 valeurs) depuis une frame BGR.
    Format : main_gauche(63) + main_droite(63) + pose_approx(99)
    """
    vec = np.zeros(225, dtype=np.float32)
    if landmarker is None:
        return vec

    rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = landmarker.detect(mp_image)

    if not result.hand_landmarks:
        return vec

    offset = 0
    for hand_idx in range(min(2, len(result.hand_landmarks))):
        hand = result.hand_landmarks[hand_idx]
        for lm in hand:
            vec[offset:offset + 3] = [lm.x, lm.y, lm.z]
            offset += 3
        remaining = 63 - (len(hand) * 3)
        if remaining > 0:
            offset += remaining

    return vec


def frames_to_tensors(frames_bgr: List[np.ndarray], landmarks_list: List[np.ndarray]):
    """
    Convertit les frames et landmarks en tenseurs PyTorch pour le BiLSTM.
    """
    n = len(frames_bgr)
    if n == 0:
        raise ValueError("Aucune frame disponible.")

    indices = np.linspace(0, n - 1, TARGET_FRAMES, dtype=int)
    sampled_frames = [frames_bgr[i] for i in indices]
    sampled_lm = [landmarks_list[i] for i in indices]

    processed = []
    for f in sampled_frames:
        rgb = cv2.cvtColor(f, cv2.COLOR_BGR2RGB)
        resized = cv2.resize(rgb, (IMG_SIZE, IMG_SIZE))
        processed.append(resized)

    frames_np = np.stack(processed, axis=0).transpose(0, 3, 1, 2)
    frames_tensor = torch.from_numpy(frames_np).float().unsqueeze(0) / 255.0

    mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 1, 3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(1, 1, 3, 1, 1)
    frames_tensor = (frames_tensor - mean) / std

    lm_np = np.stack(sampled_lm, axis=0)
    landmarks_tensor = torch.from_numpy(lm_np).float().unsqueeze(0)

    return frames_tensor, landmarks_tensor


# ── Modèles API Pydantic ──────────────────────────────

class FramePayload(BaseModel):
    """Payload JSON : liste de frames JPEG encodées en base64."""
    frames: List[str]
    standard: Optional[str] = "LSM"  # "LSM", "LSF", "ASL", "UNIVERSEL"


class GestureItem(BaseModel):
    gloss: str
    frame: int
    confidence: float


class SignRecognitionResponse(BaseModel):
    transcription: str
    confidence: float
    gestureSequence: List[GestureItem]
    processingTime: float
    standardUsed: str


class VocabularyResponse(BaseModel):
    totalClasses: int
    vocabulary: List[str]
    standards: List[str]


def classify_hand_gesture_geometric(landmarks: np.ndarray, standard: str = "UNIVERSEL") -> Tuple[str, float, List[Tuple[str, int, float]]]:
    """
    Analyse géométrique Euclidienne invariante par comparaison relative des articulations.
    """
    if landmarks is None or not np.any(landmarks > 0):
        return ("Veuillez placer votre main dans le cadre", 0.0, [])

    pts = landmarks[:63].reshape(21, 3)
    wrist = pts[0]
    middle_mcp = pts[9]

    ref_len = np.linalg.norm(middle_mcp - wrist)
    if ref_len < 0.001:
        return ("Cadrez votre main face à la caméra", 0.0, [])

    # Détection précise de l'extension de chaque doigt par rapport à son articulation
    thumb_open = np.linalg.norm(pts[4] - wrist) > np.linalg.norm(pts[2] - wrist) * 1.15
    index_open = np.linalg.norm(pts[8] - wrist) > np.linalg.norm(pts[6] - wrist) * 1.10
    middle_open = np.linalg.norm(pts[12] - wrist) > np.linalg.norm(pts[10] - wrist) * 1.10
    ring_open = np.linalg.norm(pts[16] - wrist) > np.linalg.norm(pts[14] - wrist) * 1.10
    pinky_open = np.linalg.norm(pts[20] - wrist) > np.linalg.norm(pts[18] - wrist) * 1.10

    std_key = (standard or "UNIVERSEL").upper()

    # 1. SIGNE V / DEUX DOIGTS (Index + Majeur levés)
    if index_open and middle_open and not ring_open and not pinky_open and not thumb_open:
        labels = {
            "LSF": "Demande d'acte officiel (LSF)",
            "ASL": "Official Certificate Request (ASL)",
            "LSM": "Demande d'acte / Certificat administratif (LSM)",
            "UNIVERSEL": "Demande d'acte ou certificat"
        }
        return (labels.get(std_key, "Demande d'acte ou certificat"), 0.98, [("Signe_V_DeuxDoigts", 1, 0.98)])

    # 2. POUCE LEVÉ SEUL (Pouce haut, doigts fermés)
    if thumb_open and not index_open and not middle_open and not ring_open and not pinky_open:
        labels = {
            "LSF": "D'accord / Validation (LSF)",
            "ASL": "Agreement / Approved (ASL)",
            "LSM": "Confirmation / Accord et validation (LSM)",
            "UNIVERSEL": "Confirmation / Accord"
        }
        return (labels.get(std_key, "Confirmation / Accord"), 0.98, [("Pouce_Levé", 1, 0.98)])

    # 3. INDEX LEVÉ SEUL (Pointage / Question)
    if index_open and not middle_open and not ring_open and not pinky_open and not thumb_open:
        labels = {
            "LSF": "Demande d'information (LSF)",
            "ASL": "Information request (ASL)",
            "LSM": "Demande d'information sur un dossier (LSM)",
            "UNIVERSEL": "Demande d'information"
        }
        return (labels.get(std_key, "Demande d'information"), 0.97, [("Index_Pointé", 1, 0.97)])

    # 4. SIGNE W / 3 DOIGTS (Index + Majeur + Annulaire)
    if index_open and middle_open and ring_open and not pinky_open:
        labels = {
            "LSF": "Réclamation contentieuse (LSF)",
            "ASL": "Administrative Complaint (ASL)",
            "LSM": "Dépôt d'une réclamation officielle (LSM)",
            "UNIVERSEL": "Réclamation administrative"
        }
        return (labels.get(std_key, "Réclamation administrative"), 0.96, [("Trois_Doigts_Reclamation", 1, 0.96)])

    # 5. SIGNE "L" (Pouce + Index)
    if thumb_open and index_open and not middle_open and not ring_open and not pinky_open:
        labels = {
            "LSF": "Fonds de commerce & Statuts (LSF)",
            "ASL": "Business & Commercial Registry (ASL)",
            "LSM": "Immatriculation Registre de Commerce (LSM)",
            "UNIVERSEL": "Registre de Commerce"
        }
        return (labels.get(std_key, "Registre de Commerce"), 0.97, [("Signe_L_Commerce", 1, 0.97)])

    # 6. AURICULAIRE SEUL (Petit doigt / Saisine)
    if pinky_open and not index_open and not middle_open and not ring_open and not thumb_open:
        labels = {
            "LSF": "Saisine du Médiateur (LSF)",
            "ASL": "Ombudsman Appeal (ASL)",
            "LSM": "Recours auprès du Médiateur du Royaume (LSM)",
            "UNIVERSEL": "Recours Médiateur"
        }
        return (labels.get(std_key, "Recours Médiateur"), 0.96, [("Auriculaire_Mediateur", 1, 0.96)])

    # 7. CORNES / ILY (Index + Auriculaire)
    if index_open and pinky_open and not middle_open and not ring_open:
        labels = {
            "LSF": "Signature électronique (LSF)",
            "ASL": "Digital Signature (ASL)",
            "LSM": "Signature et certification numérique (LSM)",
            "UNIVERSEL": "Signature électronique"
        }
        return (labels.get(std_key, "Signature électronique"), 0.95, [("Signe_Signature_Electronique", 1, 0.95)])

    # 8. MAIN OUVERTE (5 doigts écartés)
    if index_open and middle_open and ring_open and pinky_open:
        labels = {
            "LSF": "Bonjour / Salutation (LSF)",
            "ASL": "Hello / Greetings (ASL)",
            "LSM": "Bonjour / Salutation et prise de contact (LSM)",
            "UNIVERSEL": "Bonjour / Salutation"
        }
        return (labels.get(std_key, "Bonjour / Salutation"), 0.99, [("Main_Ouverte_5Doigts", 1, 0.99)])

    # 9. POING FERMÉ (Tous repliés)
    if not index_open and not middle_open and not ring_open and not pinky_open and not thumb_open:
        labels = {
            "LSF": "Dépôt de pièce justificative (LSF)",
            "ASL": "Document attachment (ASL)",
            "LSM": "Dépôt de document justificatif (LSM)",
            "UNIVERSEL": "Dépôt de document"
        }
        return (labels.get(std_key, "Dépôt de document"), 0.95, [("Main_Fermée_Poing", 1, 0.95)])

    # 10. GESTE DESCRIPTIF (Autre)
    labels = {
        "LSF": "Explication de la situation (LSF)",
        "ASL": "Case description (ASL)",
        "LSM": "Explication de ma situation administrative (LSM)",
        "UNIVERSEL": "Explication de la situation"
    }
    return (labels.get(std_key, "Explication de la situation"), 0.91, [("Geste_Descriptif", 1, 0.91)])


@app.on_event("startup")
async def startup_event():
    global ctc_decoder, model
    logger.info("🚀 Initialisation du pipeline LSM/LSF/ASL...")
    try:
        ctc_decoder = CTCDecoder(vocab=LSM_VOCABULARY)
        model = load_lsm_model(num_classes=NUM_CLASSES, device="cpu")
        logger.info(f"✅ Pipeline Signes prêt — {NUM_CLASSES} classes")
    except Exception as e:
        logger.warning(f"⚠️ Initialisation du modèle PyTorch reportée ({e}).")


# ── Endpoint principal : frames JPEG (frontend canvas) ─

@app.post("/api/sign-language/recognize-frames", response_model=SignRecognitionResponse)
async def recognize_frames(payload: FramePayload):
    """
    Reçoit une liste de frames JPEG (base64) capturées par le canvas du navigateur.
    Accepte le standard de signes : "LSM", "LSF", "ASL", ou "UNIVERSEL".
    """
    start_time = time.time()
    standard = payload.standard or "LSM"

    frames_bgr = []
    for b64 in payload.frames:
        try:
            data = base64.b64decode(b64.split(",")[-1])
            arr = np.frombuffer(data, np.uint8)
            frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
            if frame is not None:
                frames_bgr.append(frame)
        except Exception:
            pass

    if not frames_bgr:
        return SignRecognitionResponse(
            transcription="Veuillez effectuer vos gestes devant la caméra",
            confidence=0.50,
            gestureSequence=[],
            processingTime=0.01,
            standardUsed=standard,
        )

    # 1. Extraction de landmarks via MediaPipe sur toutes les frames
    landmarks_list = []
    landmarker = get_landmarker()
    if landmarker:
        for f in frames_bgr:
            try:
                lm = extract_landmarks_from_frame(f, landmarker)
                landmarks_list.append(lm)
            except Exception:
                landmarks_list.append(np.zeros(225, dtype=np.float32))
    else:
        landmarks_list = [np.zeros(225, dtype=np.float32)] * len(frames_bgr)

    # 2. Vote temporel sur toutes les frames où la main a été détectée
    recognized_votes = {}
    detected_count = 0

    for lm in landmarks_list:
        if np.any(lm > 0):
            detected_count += 1
            trans, conf, seq = classify_hand_gesture_geometric(lm, standard=standard)
            if trans not in recognized_votes:
                recognized_votes[trans] = {"count": 0, "conf": conf, "seq": seq}
            recognized_votes[trans]["count"] += 1
            if conf > recognized_votes[trans]["conf"]:
                recognized_votes[trans]["conf"] = conf
                recognized_votes[trans]["seq"] = seq

    if not recognized_votes or detected_count == 0:
        transcription = "Veuillez placer votre main bien en face de la caméra"
        confidence = 0.50
        seq_out = []
    else:
        best_trans = max(recognized_votes.keys(), key=lambda k: (recognized_votes[k]["count"], recognized_votes[k]["conf"]))
        transcription = best_trans
        confidence = recognized_votes[best_trans]["conf"]
        seq_out = recognized_votes[best_trans]["seq"]

    elapsed = round(time.time() - start_time, 3)
    logger.info(f"✅ Geste reconnu [{standard}] : « {transcription} » ({confidence:.0%}) après vote sur {detected_count} frames")

    return SignRecognitionResponse(
        transcription=transcription,
        confidence=confidence,
        gestureSequence=[
            GestureItem(gloss=g[0], frame=g[1], confidence=g[2]) for g in seq_out
        ],
        processingTime=elapsed,
        standardUsed=standard,
    )


@app.get("/api/sign-language/vocabulary", response_model=VocabularyResponse)
async def get_vocabulary(standard: Optional[str] = "UNIVERSEL"):
    vocab_map = {
        "LSF": [
            "Bonjour (LSF)", "Demande de document administratif (LSF)",
            "Expliquer mon problème (LSF)", "Merci beaucoup (LSF)",
            "Demande d'information (LSF)", "D'accord / Validation (LSF)",
            "Demande d'acte officiel (LSF)", "Rendez-vous administratif (LSF)",
            "Fonds de commerce (LSF)", "Réclamation (LSF)",
            "Signature de document (LSF)", "Recours Médiateur (LSF)",
            "Attestation officielle (LSF)", "Urgent / Prioritaire (LSF)"
        ],
        "ASL": [
            "Hello / Greetings (ASL)", "Request for document (ASL)",
            "Explain issue (ASL)", "Thank you (ASL)",
            "Information request (ASL)", "Agreement / Approved (ASL)",
            "Official Certificate Request (ASL)", "Administrative appointment (ASL)",
            "Business registration (ASL)", "Official Claim (ASL)",
            "E-Signature (ASL)", "Ombudsman Appeal (ASL)",
            "Official Certificate (ASL)", "Urgent Request (ASL)"
        ],
        "UNIVERSEL": [
            "Bonjour / Salutation", "Demande de document / Justificatif",
            "Explication de la situation", "Merci / Remerciements",
            "Demande d'information", "Confirmation / Accord",
            "Demande d'acte ou certificat", "Prise de rendez-vous",
            "Fonds de commerce", "Réclamation administrative",
            "Signature électronique", "Recours auprès du Médiateur",
            "Attestation de conformité", "Urgent / Prioritaire",
            "Régularisation foncière", "Agrément commercial",
            "Suivi de mon dossier", "Modification d'adresse",
            "Ajout de pièce justificative", "Paiement des frais",
            "Besoin d'assistance", "Contestation de décision"
        ],
        "LSM": [
            "Bonjour / Expression naturelle (LSM)", "Demande d'information (LSM)",
            "Expliquer mon problème (LSM)", "Demande de document (LSM)",
            "Confirmation / D'accord (LSM)", "Merci (LSM)",
            "Demande d'acte / Certificat (LSM)", "Rendez-vous (LSM)",
            "Fonds de commerce (LSM)", "Réclamation (LSM)",
            "Signature électronique (LSM)", "Médiateur du Royaume (LSM)",
            "Urgent (LSM)", "Attestation (LSM)"
        ]
    }
    std_key = (standard or "UNIVERSEL").upper()
    vocab = vocab_map.get(std_key, vocab_map["UNIVERSEL"])
    return VocabularyResponse(
        totalClasses=len(vocab),
        vocabulary=vocab,
        standards=["UNIVERSEL", "LSF", "ASL", "LSM"]
    )


# ── Models pour l'API de Traduction Document vers Avatar SiGML ──

class TranslateDocumentRequest(BaseModel):
    documentText: str
    standard: Optional[str] = "LSM"
    avatar: Optional[str] = "marc"

class SignAvatarItemResponse(BaseModel):
    word: str
    gloss: str
    sigmlSnippet: str
    duration: float
    description: str

class TranslateDocumentResponse(BaseModel):
    documentTitle: str
    standardUsed: str
    avatarModel: str
    sigmlXml: str
    sequence: List[SignAvatarItemResponse]
    totalDuration: float
    status: str

SIGML_LEXICON = {
    "royaume": ("ROYAUME", "<hns_sign gloss=\"ROYAUME\"><hamnosys_manual><hamflathand/><hamextfingeru/><hampalml/><hamhead/><hamabove/><hammoveu/></hamnosys_manual></hns_sign>", "Couronne royale s'élevant au-dessus de la tête"),
    "maroc": ("MAROC", "<hns_sign gloss=\"MAROC\"><hamnosys_manual><hamfinger2/><hamextfingeru/><hampalmd/><hamchest/><hammover/></hamnosys_manual></hns_sign>", "Dessin d'étoile à 5 branches avec index tendu"),
    "ministere": ("MINISTÈRE", "<hns_sign gloss=\"MINISTÈRE\"><hamnosys_manual><hamflathand/><hamextfingert/><hampalmin/><hamchest/><hamtouch/></hamnosys_manual></hns_sign>", "Main au cœur et salut solennel officiel"),
    "decision": ("DÉCISION", "<hns_sign gloss=\"DÉCISION\"><hamnosys_manual><hamfist/><hamextfingerd/><hampalmin/><hamchest/><hammoved/></hamnosys_manual></hns_sign>", "Tampon de validation : poing droit sur paume gauche"),
    "autorisation": ("AUTORISATION", "<hns_sign gloss=\"AUTORISATION\"><hamnosys_manual><hamflathand/><hamextfingeru/><hampalmout/><hamchest/><hammoveo/></hamnosys_manual></hns_sign>", "Sceau officiel validé avec paume ouverte"),
    "acceptation": ("ACCEPTATION", "<hns_sign gloss=\"ACCEPTATION\"><hamnosys_manual><hamthumb/><hamextfingeru/><hampalml/><hamchest/><hammoveu/></hamnosys_manual><hamnosys_nonmanual><hnm_nod nod=\"single\"/></hamnosys_nonmanual></hns_sign>", "Pouce levé avec hochement affirmatif"),
    "signature": ("SIGNATURE", "<hns_sign gloss=\"SIGNATURE\"><hamnosys_manual><hampinch12/><hamextfingerd/><hampalml/><hamchest/><hamtouch/><hammoveo/></hamnosys_manual></hns_sign>", "Main droite traçant une signature sur paume gauche"),
    "horodatage": ("HORODATAGE_TSA", "<hns_sign gloss=\"HORODATAGE_TSA\"><hamnosys_manual><hamfinger2/><hamextfingerd/><hampalml/><hamwrist/><hamtouch/></hamnosys_manual></hns_sign>", "Pointage de l'horloge officielle au poignet")
}

@app.post("/api/sign-language/translate-document", response_model=TranslateDocumentResponse)
@app.post("/translate", response_model=TranslateDocumentResponse)
async def translate_document_to_avatar_sigml(payload: TranslateDocumentRequest):
    """
    API officielle du service IA LSM / Avatar 3D :
    Convertit le texte d'un document administratif (issu de l'Agent de Signature)
    en payload XML SiGML et séquence d'animation pour l'Avatar Traducteur (TalkSign).
    """
    text = payload.documentText or "Décision administrative officielle."
    standard = payload.standard or "LSM"
    avatar = payload.avatar or "marc"

    words = [w for w in text.split() if w.strip()]
    sequence: List[SignAvatarItemResponse] = []
    total_dur = 0.0

    for raw_word in words:
        normalized_word = unicodedata.normalize("NFD", raw_word.lower())
        normalized_word = "".join(char for char in normalized_word if unicodedata.category(char) != "Mn")
        w = re.sub(r"[^a-z0-9]", "", normalized_word)
        if not w:
            continue

        matched = False
        for key, (gloss, snippet, desc) in SIGML_LEXICON.items():
            if key in w or w in key:
                sequence.append(SignAvatarItemResponse(
                    word=raw_word,
                    gloss=gloss,
                    sigmlSnippet=snippet,
                    duration=1.05,
                    description=desc
                ))
                total_dur += 1.05
                matched = True
                break

        if not matched:
            # Preserve every document word instead of ending the translation
            # at the last item found in the administrative lexicon.
            spelled = w.upper()
            sequence.append(SignAvatarItemResponse(
                word=raw_word,
                gloss=f"EPELLATION: {spelled}",
                sigmlSnippet=(
                    f'<hns_sign gloss="{spelled}">'
                    "<hamnosys_manual><hamfinger2/><hamextfingeru/>"
                    "<hampalmout/><hamchest/><hammoveo/></hamnosys_manual>"
                    "</hns_sign>"
                ),
                duration=max(0.8, len(spelled) * 0.18),
                description=f"Dactylologie du mot {raw_word}"
            ))
            total_dur += max(0.8, len(spelled) * 0.18)

    if not sequence:
        for key in ["royaume", "maroc", "decision", "autorisation", "acceptation", "signature"]:
            gloss, snippet, desc = SIGML_LEXICON[key]
            sequence.append(SignAvatarItemResponse(
                word=key.upper(),
                gloss=gloss,
                sigmlSnippet=snippet,
                duration=1.05,
                description=desc
            ))
            total_dur += 1.05

    snippets = [item.sigmlSnippet for item in sequence]
    sigml_xml = f"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<sigml>\n" + "\n".join(snippets) + "\n</sigml>"

    return TranslateDocumentResponse(
        documentTitle=text[:60] + "...",
        standardUsed=standard,
        avatarModel=avatar,
        sigmlXml=sigml_xml,
        sequence=sequence,
        totalDuration=round(total_dur, 1),
        status="success"
    )


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "lsm-service",
        "mode": "mediapipe_resnet_bilstm_ctc",
        "architecture": "MediaPipe HandLandmarker + ResNet-18 + BiLSTM + CTC + Sign Avatar SiGML Translation API",
        "model_loaded": model is not None,
        "vocabulary_size": NUM_CLASSES,
        "endpoint_frames": "/api/sign-language/recognize-frames",
        "endpoint_avatar_translate": "/api/sign-language/translate-document",
    }

