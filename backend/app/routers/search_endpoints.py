from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Dict
from datetime import datetime, timedelta
from app.services.search_service import search_service
from app.core.threat_cache_service import threat_cache
from app.core.cache_manager import cache_result
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/threats")
@cache_result(ttl=60, prefix="api_search")
async def search_threats(
    q: Optional[str] = Query(None, description="Search query"),
    type: Optional[str] = Query(None, description="Threat type"),
    severity: Optional[str] = Query(None, description="Severity level"),
    source_ip: Optional[str] = Query(None, description="Source IP"),
    destination_ip: Optional[str] = Query(None, description="Destination IP"),
    country: Optional[str] = Query(None, description="Country"),
    from_date: Optional[str] = Query(None, description="From date (ISO format)"),
    to_date: Optional[str] = Query(None, description="To date (ISO format)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page")
):
    """
    Search threats with advanced filters
    """
    try:
        # Build filters
        filters = {}
        
        if type:
            filters["type"] = type
        if severity:
            filters["severity"] = severity
        if source_ip:
            filters["source_ip"] = source_ip
        if destination_ip:
            filters["destination_ip"] = destination_ip
        if country:
            filters["destination_country"] = country
        
        # Date range
        if from_date or to_date:
            date_filter = {}
            if from_date:
                date_filter["gte"] = from_date
            if to_date:
                date_filter["lte"] = to_date
            filters["timestamp"] = date_filter
        
        # Calculate from/size
        from_ = (page - 1) * page_size
        size = page_size
        
        # Search
        result = await search_service.search_threats(
            query=q,
            filters=filters if filters else None,
            from_=from_,
            size=size
        )
        
        return {
            "success": True,
            "data": result["hits"],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": result["total"],
                "total_pages": (result["total"] + page_size - 1) // page_size
            },
            "aggregations": result.get("aggregations", {}),
            "took": result.get("took", 0)
        }
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/iocs")
async def search_iocs(
    q: Optional[str] = Query(None, description="IOC value"),
    type: Optional[str] = Query(None, description="IOC type"),
    confidence_min: float = Query(0, ge=0, le=100, description="Minimum confidence"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    """
    Search Indicators of Compromise (IOCs)
    """
    try:
        from_ = (page - 1) * page_size
        
        result = await search_service.search_iocs(
            value=q,
            type=type,
            confidence_min=confidence_min,
            from_=from_,
            size=page_size
        )
        
        return {
            "success": True,
            "data": result["hits"],
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": result["total"],
                "total_pages": (result["total"] + page_size - 1) // page_size
            },
            "aggregations": result.get("aggregations", {})
        }
    except Exception as e:
        logger.error(f"IOC search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/threats/index")
async def index_threat(threat_data: Dict):
    """
    Index a new threat
    """
    try:
        doc_id = await search_service.index_threat(threat_data)
        
        # Invalidate cache
        await threat_cache.invalidate_threats()
        
        return {
            "success": True,
            "id": doc_id,
            "message": "Threat indexed successfully"
        }
    except Exception as e:
        logger.error(f"Index failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/threats/bulk-index")
async def bulk_index_threats(threats: List[Dict]):
    """
    Bulk index multiple threats
    """
    try:
        count = await search_service.bulk_index_threats(threats)
        
        # Invalidate cache
        await threat_cache.invalidate_threats()
        
        return {
            "success": True,
            "count": count,
            "message": f"Indexed {count} threats"
        }
    except Exception as e:
        logger.error(f"Bulk index failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/threats/{doc_id}")
async def delete_threat(doc_id: str):
    """
    Delete a threat document
    """
    try:
        deleted = await search_service.delete_threat(doc_id)
        
        if deleted:
            await threat_cache.invalidate_threats()
            return {"success": True, "message": "Threat deleted"}
        else:
            raise HTTPException(status_code=404, detail="Threat not found")
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/autocomplete")
async def get_autocomplete(
    q: str = Query(..., description="Prefix to autocomplete")
):
    """
    Get autocomplete suggestions
    """
    try:
        suggestions = await search_service.get_suggestions(q)
        return {
            "success": True,
            "suggestions": suggestions
        }
    except Exception as e:
        logger.error(f"Autocomplete failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_search_stats():
    """
    Get search statistics
    """
    from app.core.elasticsearch_config import es_config
    try:
        # Get cluster health
        health = es_config.get_cluster_health()
        
        # Get index stats
        client = es_config.get_client()
        stats = client.indices.stats(index=es_config.index_names["threats"])
        
        return {
            "success": True,
            "cluster": {
                "status": health.get("status"),
                "nodes": health.get("number_of_nodes"),
                "data_nodes": health.get("number_of_data_nodes"),
                "active_shards": health.get("active_shards")
            },
            "index": {
                "doc_count": stats["_all"]["primaries"]["docs"]["count"],
                "size": stats["_all"]["primaries"]["store"]["size_in_bytes"],
                "indexing": stats["_all"]["primaries"]["indexing"],
                "search": stats["_all"]["primaries"]["search"]
            }
        }
    except Exception as e:
        logger.error(f"Stats failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
