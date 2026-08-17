from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

app = FastAPI(title="TTS Service")


@app.post("/api/voice/synthesize")
async def synthesize(payload: dict):
    return PlainTextResponse("TODO audio stream", media_type="audio/mpeg")
