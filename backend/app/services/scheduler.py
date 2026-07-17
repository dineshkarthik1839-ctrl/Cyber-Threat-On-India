from apscheduler.schedulers.background import BackgroundScheduler
from app.database.database import SessionLocal
from app.services.threat_collector import collect_and_save_all
from app.crud.settings import get_collector_settings

scheduler = BackgroundScheduler()

def fetch_job():
    """Background thread database session worker for intelligence collection."""
    db = SessionLocal()
    try:
        collect_and_save_all(db)
    except Exception as e:
        print(f"Error in background collector thread: {e}")
    finally:
        db.close()

def start_scheduler():
    """Start APScheduler thread."""
    if not scheduler.running:
        # Load polling frequency setting from DB or default to 10 minutes
        db = SessionLocal()
        try:
            settings = get_collector_settings(db)
            interval = settings.poll_interval_minutes or 10
        except Exception:
            interval = 10
        finally:
            db.close()

        scheduler.add_job(
            fetch_job,
            "interval",
            minutes=interval,
            id="threat_collector_job",
            replace_existing=True
        )
        scheduler.start()
        print(f"APScheduler Started: Background threat collectors running every {interval} minutes.")

def restart_scheduler(new_interval: int):
    """Dynamically adjust polling interval without server restart."""
    if scheduler.running:
        scheduler.modify_job("threat_collector_job", trigger="interval", minutes=new_interval)
        print(f"APScheduler Updated: Polling interval adjusted to {new_interval} minutes.")

def shutdown_scheduler():
    """Terminate APScheduler background thread."""
    if scheduler.running:
        scheduler.shutdown()
        print("APScheduler Shutdown.")
