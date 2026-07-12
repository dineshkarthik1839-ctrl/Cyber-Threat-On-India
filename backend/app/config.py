import os
from dotenv import load_dotenv
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ictip.db")
ABUSEIPDB_API_KEY = os.getenv("ABUSEIPDB_API_KEY", "")
CORS_ORIGINS = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]
APP_ENV = os.getenv("APP_ENV", "development")