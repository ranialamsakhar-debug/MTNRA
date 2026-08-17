# Services IA - Tifawin X.0

Services exposes:

1. stt-service: /api/voice/transcribe
2. tts-service: /api/voice/synthesize
3. lsm-service: /api/sign-language/recognize
4. document-verify-service: /api/document/verify
5. chatbot-rag-service: /api/chatbot/query

Execution (example):

uvicorn app:app --reload --port 8001
