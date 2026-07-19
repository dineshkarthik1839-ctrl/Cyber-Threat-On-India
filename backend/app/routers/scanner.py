import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Any

from app.database.dependencies import get_db
from app.services.security import get_current_user
from app.models.user import User
from app.models.scan import DomainScan
from app.services.scanner import analyze_domain
from app.crud.settings import get_collector_settings

from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    url: str
    force: bool = False

router = APIRouter(tags=["scanner"])

@router.post("/analyze/domain")
async def analyze_website_domain(
    request: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    # Normalize domain
    domain = request.url.lower().replace("http://", "").replace("https://", "").split("/")[0]
    force = request.force
    
    if not domain:
        raise HTTPException(status_code=400, detail="Invalid domain provided")
        
    # Check cache first
    if not force:
        cached_scan = db.query(DomainScan).filter(
            DomainScan.domain == domain,
            DomainScan.created_at >= datetime.utcnow() - timedelta(hours=24)
        ).order_by(DomainScan.created_at.desc()).first()
        
        if cached_scan:
            return cached_scan.raw_data
            
    # Fetch API Key from settings
    settings = get_collector_settings(db)
    otx_key = settings.otx_key if settings else None
    
    try:
        scan_results = await analyze_domain(domain, otx_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
        
    # Save to database
    new_scan = DomainScan(
        domain=domain,
        risk_score=scan_results["risk_score"],
        risk_level=scan_results["risk_level"],
        ip_addresses=scan_results["ip_addresses"],
        dns_records=scan_results["dns_records"],
        ssl_info=scan_results["ssl_info"],
        security_headers=scan_results["security_headers"],
        otx_pulses=scan_results["otx_pulses"],
        has_malicious_reputation=scan_results["has_malicious_reputation"],
        raw_data=scan_results
    )
    
    db.add(new_scan)
    db.commit()
    db.refresh(new_scan)
    
    # Update raw_data to include UUID
    scan_results["scan_uuid"] = new_scan.scan_uuid
    
    return scan_results
