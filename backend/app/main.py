from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.config import CORS_ORIGINS
from app.database.database import engine
from app.models.attack import Base
from app.routers import attacks, threat_feed

@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="India Cyber Threat Intelligence Platform", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"], allow_headers=["Authorization", "Content-Type"])
app.include_router(attacks.router, prefix="/api/v1")
app.include_router(threat_feed.router, prefix="/api/v1")

@app.get("/health", tags=["Operations"])
def health():
    return {"status": "healthy", "service": "ictip-api", "version": app.version}

@app.websocket("/ws/threats")
async def threat_socket(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.receive_text()
            await websocket.send_json({"type": "heartbeat", "status": "connected"})
    except WebSocketDisconnect:
        return