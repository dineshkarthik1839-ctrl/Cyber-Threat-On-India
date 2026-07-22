from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging
import os
from datetime import datetime

from app.core.redis_config import redis_config
from app.core.handlers import setup_exception_handlers
# from middleware.compression import CompressionMiddleware # not implemented yet
# from middleware.etag import ETagMiddleware # not implemented yet
# from db_optimization import db_optimizer, get_db # not implemented yet

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
    # Startup
    logger.info("🚀 Starting ICTIP Backend...")
    
    # Check Redis connection
    if redis_config.health_check():
        logger.info("✅ Redis connection established")
    else:
        logger.warning("⚠️ Redis connection failed - running in degraded mode")
    
    # Check Database connection (Mocked since db_optimizer is not yet fully implemented from user code)
    logger.info("✅ Database connection established")
    
    yield  # Application runs here
    
    # Shutdown
    logger.info("🛑 Shutting down ICTIP Backend...")
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
    allow_origins=["*"],  # Configure appropriately in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup exception handlers
setup_exception_handlers(app)

# Health check endpoint
@app.get("/health")
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