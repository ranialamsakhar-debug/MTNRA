import io
import logging
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tts-service")

app = FastAPI(
    title="MTNRA - Text-to-Speech (TTS) Service",
    description="Service de synthèse vocale neuronale naturelle en Français et en Arabe marocain.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VOICE_MAPPING = {
    "fr-FR-HenriNeural": {"lang": "fr", "gender": "Masculin", "label": "Français (Henri)"},
    "fr-FR-DeniseNeural": {"lang": "fr", "gender": "Féminin", "label": "Français (Denise)"},
    "ar-MA-MounaNeural": {"lang": "ar", "gender": "Féminin", "label": "Arabe Marocain (Mouna)"},
    "ar-MA-JamalNeural": {"lang": "ar", "gender": "Masculin", "label": "Arabe Marocain (Jamal)"},
    "ar-SA-HamedNeural": {"lang": "ar", "gender": "Masculin", "label": "Arabe Standard (Hamed)"},
}

DEFAULT_VOICE_FR = "fr-FR-HenriNeural"
DEFAULT_VOICE_AR = "ar-MA-MounaNeural"


class TTSRequest(BaseModel):
    text: str
    language: Optional[str] = "fr"
    voice: Optional[str] = None
    speed: Optional[str] = "+0%"


async def generate_with_edge_tts(text: str, voice: str, rate: str = "+0%") -> bytes:
    """Génère un flux audio MP3 haute fidélité avec Edge-TTS (sans clé API)."""
    import edge_tts

    communicate = edge_tts.Communicate(text, voice, rate=rate)
    audio_buffer = io.BytesIO()

    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_buffer.write(chunk["data"])

    audio_buffer.seek(0)
    return audio_buffer.read()


def generate_with_gtts(text: str, language: str = "fr") -> bytes:
    """Génération de secours avec Google TTS."""
    from gtts import gTTS

    lang_code = "ar" if language.startswith("ar") else "fr"
    tts = gTTS(text=text, lang=lang_code, slow=False)
    audio_buffer = io.BytesIO()
    tts.write_to_fp(audio_buffer)
    audio_buffer.seek(0)
    return audio_buffer.read()


@app.post("/api/voice/synthesize")
async def synthesize(payload: TTSRequest):
    """
    Convertit un texte en flux audio MP3 haute qualité.
    """
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Le texte à synthétiser ne peut pas être vide.")

    # Déterminer la voix
    language = payload.language or "fr"
    voice = payload.voice
    if not voice:
        voice = DEFAULT_VOICE_AR if language.startswith("ar") else DEFAULT_VOICE_FR

    speed = payload.speed or "+0%"

    logger.info(f"🔊 Synthèse vocale pour : '{text[:40]}...' (Voix: {voice})")

    # 1. Essai avec Edge-TTS (voix neuronales très naturelles)
    try:
        audio_bytes = await generate_with_edge_tts(text, voice, rate=speed)
        if len(audio_bytes) > 0:
            return StreamingResponse(
                io.BytesIO(audio_bytes),
                media_type="audio/mpeg",
                headers={
                    "Content-Disposition": "inline; filename=speech.mp3",
                    "Cache-Control": "no-cache",
                },
            )
    except Exception as e:
        logger.warning(f"⚠️ Edge-TTS a échoué ({e}). Utilisation de gTTS de secours...")

    # 2. Secours avec gTTS
    try:
        audio_bytes = generate_with_gtts(text, language=language)
        return StreamingResponse(
            io.BytesIO(audio_bytes),
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=speech.mp3",
                "Cache-Control": "no-cache",
            },
        )
    except Exception as e:
        logger.error(f"❌ Échec total de la synthèse vocale : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur de synthèse vocale : {str(e)}")


@app.get("/api/voice/voices")
async def list_voices():
    """Renvoie la liste des voix neuronales disponibles."""
    return {
        "voices": [
            {"id": k, "label": v["label"], "gender": v["gender"], "language": v["lang"]}
            for k, v in VOICE_MAPPING.items()
        ]
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "tts-service",
        "engines": ["Microsoft Edge Neural TTS", "Google TTS"],
        "default_voices": {"fr": DEFAULT_VOICE_FR, "ar": DEFAULT_VOICE_AR},
    }
