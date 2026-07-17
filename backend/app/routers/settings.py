from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.dependencies import get_db
from app.schemas.settings import CollectorSettings
from app.crud.settings import get_collector_settings, update_collector_settings
from app.services.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/settings", tags=["Configuration"])

@router.get("", response_model=CollectorSettings)
def read_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve platform configuration settings."""
    return get_collector_settings(db)

@router.put("", response_model=CollectorSettings)
def save_settings(
    settings: CollectorSettings,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update platform configuration settings (requires active analyst session)."""
    return update_collector_settings(db, settings)
