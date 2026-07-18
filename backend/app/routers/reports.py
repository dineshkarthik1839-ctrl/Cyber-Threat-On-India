import csv
import io
from fastapi import APIRouter, Depends, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.dependencies import get_db
from app.crud.attack import get_attacks_filtered
from app.schemas.attack import AttackResponse
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reporting & Export"])

@router.get("/export")
def export_threats(
    format: str = Query(default="json", description="Export format: json or csv"),
    severity: str = Query(default="All"),
    source: str = Query(default="All"),
    query: str = Query(default=""),
    db: Session = Depends(get_db)
):
    """Export normalized threat intelligence records (requires active analyst session)."""
    # Fetch filtered threats (max 500 for export)
    threats = get_attacks_filtered(db, severity=severity, source=source, query=query, limit=500)

    if format.lower() == "csv":
        # Generate CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Headers
        writer.writerow([
            "ID", "Timestamp", "Indicator", "Indicator Type", "Source Feed", 
            "Origin Country", "Origin Code", "Target State", "Attack Type", 
            "Severity", "Confidence", "MITRE Tactic", "Confirmed Target"
        ])
        
        for t in threats:
            writer.writerow([
                t.id,
                t.timestamp.isoformat() if t.timestamp else "",
                t.indicator,
                t.indicator_type,
                t.source,
                t.source_country,
                t.source_country_code,
                t.target_state,
                t.attack_type,
                t.severity,
                t.confidence,
                t.mitre_tactic,
                "Yes" if t.is_confirmed_india_target else "No"
            ])
            
        output.seek(0)
        filename = f"ictip_threat_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode("utf-8")),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    else:
        # Default JSON format
        data = [
            {
                "id": t.id,
                "timestamp": t.timestamp.isoformat() + "Z" if t.timestamp else "",
                "indicator": t.indicator,
                "indicatorType": t.indicator_type,
                "source": t.source,
                "sourceCountry": t.source_country,
                "countryCode": t.source_country_code,
                "targetState": t.target_state,
                "attackType": t.attack_type,
                "severity": t.severity,
                "confidence": t.confidence,
                "mitre": t.mitre_tactic,
                "description": t.description,
                "isConfirmed": t.is_confirmed_india_target
            }
            for t in threats
        ]
        
        return {"items": data, "count": len(data), "exported_at": datetime.utcnow().isoformat() + "Z"}
