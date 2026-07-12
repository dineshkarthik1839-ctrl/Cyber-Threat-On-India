from fastapi import APIRouter
from app.collectors.abuseipdb import fetch_blacklist

router = APIRouter(prefix="/threats", tags=["Threat Intelligence"])


@router.get("/abuseipdb")
def get_abuseipdb_feed():

    data = fetch_blacklist()

    return data