from fastapi import FastAPI

app = FastAPI(title="Chatbot RAG Service")


@app.post("/api/chatbot/query")
async def query(payload: dict):
    return {
        "reponse": "TODO",
        "sources": [],
        "confiance": 0.0,
        "conversationId": "",
    }
