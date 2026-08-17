from fastapi import FastAPI, UploadFile, File, Form

app = FastAPI(title="Document Verify Service")


@app.post("/api/document/verify")
async def verify(file: UploadFile = File(...), documentType: str = Form(...)):
    return {
        "scoreFiabilite": 0.0,
        "anomalies": [],
        "hash": "sha256:TODO",
        "documentTypeDetected": documentType,
        "extractedData": {
            "nom": "",
            "prenom": "",
            "cin": "",
        },
        "isAuthentic": False,
    }
