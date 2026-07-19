import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.config import CORS_ORIGINS
from app.database.database import engine, Base
# Import models to register them on Base
import app.models
from app.database.dependencies import get_db
from app.database.database import SessionLocal
from app.models.user import User
from app.services.security import get_password_hash
from app.services.scheduler import start_scheduler, shutdown_scheduler
from app.services.telemetry_generator import run_telemetry_simulator
from app.services.websocket_manager import manager

# Import routers
from app.routers import attacks, threat_feed, auth, settings, ioc, reports, ai_analyst, investigations, sensors
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Create DB tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # 1.5 Add missing columns to 'attacks' table safely (fixes 500 error on remote Postgres/SQLite)
    from sqlalchemy import text, inspect
    try:
        inspector = inspect(engine)
        if inspector.has_table("attacks"):
            existing_columns = {col['name'] for col in inspector.get_columns("attacks")}
            from app.models.attack import Attack
            
            with engine.connect() as conn:
                for column in Attack.__table__.columns:
                    if column.name not in existing_columns:
                        try:
                            # Compile column type for the current dialect (e.g. VARCHAR(64))
                            col_type = column.type.compile(engine.dialect)
                            conn.execute(text(f"ALTER TABLE attacks ADD COLUMN {column.name} {col_type};"))
                            print(f"Auto-migrated column: {column.name}")
                        except Exception as e:
                            print(f"Warning: Failed to add column {column.name}: {e}")
                conn.commit()
    except Exception as e:
        print(f"Skipped column auto-migration: {e}")
    
    # 2. Seed default analyst user
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "dineshkarthik1839@gmail.com").first()
        if not user:
            default_user = User(
                email="dineshkarthik1839@gmail.com",
                hashed_password=get_password_hash("A73897389@"),
                role="admin"
            )
            db.add(default_user)
            db.commit()
            print("Default analyst user seeded: dineshkarthik1839@gmail.com")
    except Exception as e:
        print(f"Error seeding user: {e}")
    finally:
        db.close()
        
    # 3. Start APScheduler background collectors
    start_scheduler()
    
    # 4. Start Telemetry Simulator loop
    sim_task = asyncio.create_task(run_telemetry_simulator())
    
    yield
    
    # Clean up background tasks on shutdown
    sim_task.cancel()
    shutdown_scheduler()

app = FastAPI(
    title="India Cyber Threat Intelligence Platform (ICTIP)",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"]
)

# Mount REST endpoints
import traceback
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"Global exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "traceback": traceback.format_exc()
        }
    )

app.include_router(auth.router, prefix="/api/v1")
app.include_router(attacks.router, prefix="/api/v1")
app.include_router(threat_feed.router, prefix="/api/v1")
app.include_router(settings.router, prefix="/api/v1/settings", tags=["settings"])
app.include_router(investigations.router, prefix="/api/v1/investigations", tags=["investigations"])
app.include_router(ioc.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")
app.include_router(ai_analyst.router, prefix="/api/v1")
app.include_router(sensors.router, prefix="/api/v1")
app.include_router(scanner.router, prefix="/api/v1")

@app.get("/health", tags=["Operations"])
def health():
    return {"status": "healthy", "service": "ictip-api", "version": app.version}

@app.websocket("/ws/threats")
async def threat_socket(websocket: WebSocket):
    """WebSocket endpoint to push normalized threat telemetry in real-time."""
    await manager.connect(websocket)
    try:
        while True:
            # Receive heartbeat and keep connection alive
            await websocket.receive_text()
            await websocket.send_json({"type": "heartbeat", "status": "connected"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Serve frontend static files
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))