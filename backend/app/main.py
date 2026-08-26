import asyncio
from fastapi import FastAPI, Depends, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from contextlib import asynccontextmanager
import logging
import os
import traceback
from datetime import datetime

from app.core.redis_config import redis_config
from app.core.handlers import setup_exception_handlers

from app.database.database import engine, Base, SessionLocal
import app.models
from app.models.user import User
from app.services.security import get_password_hash
from app.services.scheduler import start_scheduler, shutdown_scheduler
from app.services.telemetry_generator import run_telemetry_simulator
from app.services.websocket_manager import manager

# Import and include routers
from app.routers import attacks, threat_feed, auth, settings, ioc, reports, ai_analyst, investigations, sensors, scanner, search_endpoints

# Setup logging
logging.basicConfig(
    level=logging.INFO if os.getenv("ENVIRONMENT") != "development" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager for startup/shutdown events"""
    logger.info("🚀 Starting ICTIP Backend...")
    
    # 1. Create DB tables if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # 1.5 Add missing columns to 'attacks' table safely
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
                            col_type = column.type.compile(engine.dialect)
                            conn.execute(text(f"ALTER TABLE attacks ADD COLUMN {column.name} {col_type};"))
                            logger.info(f"Auto-migrated column: {column.name}")
                        except Exception as e:
                            logger.warning(f"Failed to add column {column.name}: {e}")
                conn.commit()
    except Exception as e:
        logger.warning(f"Skipped column auto-migration: {e}")
    
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
            logger.info("Default analyst user seeded")
    except Exception as e:
        logger.error(f"Error seeding user: {e}")
    finally:
        db.close()
        
    # Check Redis connection
    if redis_config.health_check():
        logger.info("✅ Redis connection established")
    else:
        logger.warning("⚠️ Redis connection failed - running in degraded mode")
    
    logger.info("✅ Database connection established")
    
    # 3. Start APScheduler background collectors
    start_scheduler()
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("🛑 Shutting down ICTIP Backend...")
    shutdown_scheduler()
    try:
        redis_config.clear_all_cache()
        logger.info("✅ Redis connections closed")
    except Exception as e:
        logger.error(f"❌ Redis close failed: {e}")

# Initialize FastAPI app
app = FastAPI(
    title="ICTIP API",
    description="India Cyber Threat Intelligence Platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Setup middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup exception handlers
setup_exception_handlers(app)

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "traceback": traceback.format_exc()
        }
    )

# Include all routers
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
app.include_router(search_endpoints.router, prefix="/api/v1")

# Health check endpoint
@app.get("/health", tags=["Operations"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {
            "database": True,
            "redis": redis_config.health_check(),
            "cache_stats": redis_config.get_cache_stats()
        }
    }

@app.websocket("/ws/threats")
async def threat_socket(websocket: WebSocket):
    """WebSocket endpoint to push normalized threat telemetry in real-time."""
    await manager.connect(websocket)
    try:
        while True:
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

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": "ICTIP API",
        "version": "1.0.0",
        "status": "operational",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)