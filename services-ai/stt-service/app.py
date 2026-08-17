from fastapi import FastAPI, UploadFile, File, Form

app = FastAPI(title="STT Service")


@app.post("/api/voice/transcribe")
async def transcribe(file: UploadFile = File(...), language: str = Form("fr")):
    return {
        "transcription": "TODO",
        "confidence": 0.0,
        "languageDetected": language,
        "duration": 0.0,
    }
