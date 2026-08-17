from fastapi import FastAPI, UploadFile, File

app = FastAPI(title="LSM Service")


@app.post("/api/sign-language/recognize")
async def recognize(video: UploadFile = File(...)):
    return {
        "transcription": "TODO",
        "confidence": 0.0,
        "gestureSequence": [],
        "processingTime": 0.0,
    }
