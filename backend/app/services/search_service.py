from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk, async_bulk
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import hashlib
import json
import logging
from app.core.cache_manager import cache_result
from app.core.elasticsearch_config import es_config

logger = logging.getLogger(__name__)

class SearchService:
    """Elasticsearch search service for threat intelligence"""
    
    def __init__(self):
        self.client = es_config.get_client()
        self.async_client = es_config.get_async_client()
        self.index = es_config.index_names["threats"]
        self.ioc_index = es_config.index_names["iocs"]
        self.incident_index = es_config.index_names["incidents"]
        
    @cache_result(ttl=300, prefix="search")
    async def search_threats(
        self,
        query: Optional[str] = None,
        filters: Optional[Dict] = None,
        from_: int = 0,
        size: int = 20,
        sort: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """Search threats with full-text and filters"""
        
        # Build query
        must_queries = []
        
        # Full-text search
        if query:
            must_queries.append({
                "multi_match": {
                    "query": query,
                    "fields": [
                        "description^3",
                        "source_ip^2",
                        "destination_ip^2",
                        "type",
                        "tags"
                    ],
                    "fuzziness": "AUTO",
                    "operator": "or"
                }
            })
        
        # Filters
        if filters:
            for key, value in filters.items():
                if key in ["timestamp", "created_at", "updated_at"]:
                    # Date range filter
                    if isinstance(value, dict):
                        must_queries.append({
                            "range": {key: value}
                        })
                elif key in ["source_ip", "destination_ip"]:
                    # IP range filter
                    if isinstance(value, list):
                        must_queries.append({
                            "terms": {key: value}
                        })
                elif key == "location":
                    # Geo filter
                    if "distance" in value and "location" in value:
                        must_queries.append({
                            "geo_distance": {
                                "distance": value["distance"],
                                "location": value["location"]
                            }
                        })
                else:
                    # Regular term filter
                    must_queries.append({
                        "term": {key: value}
                    })
        
        # Build complete query
        search_body = {
            "query": {
                "bool": {
                    "must": must_queries if must_queries else [{"match_all": {}}]
                }
            },
            "from": from_,
            "size": size,
            "sort": sort or [{"timestamp": {"order": "desc"}}],
            "aggs": {
                "severity_count": {
                    "terms": {"field": "severity"}
                },
                "type_count": {
                    "terms": {"field": "type"}
                },
                "country_count": {
                    "terms": {"field": "destination_country"}
                },
                "over_time": {
                    "date_histogram": {
                        "field": "timestamp",
                        "interval": "hour"
                    }
                }
            }
        }
        
        try:
            response = await self.async_client.search(
                index=self.index,
                body=search_body
            )
            
            return {
                "total": response["hits"]["total"]["value"],
                "max_score": response["hits"]["max_score"],
                "hits": [hit["_source"] for hit in response["hits"]["hits"]],
                "aggregations": response.get("aggregations", {}),
                "took": response.get("took", 0)
            }
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return {
                "total": 0,
                "hits": [],
                "aggregations": {},
                "error": str(e)
            }
    
    @cache_result(ttl=3600, prefix="ioc_search")
    async def search_iocs(
        self,
        value: Optional[str] = None,
        type: Optional[str] = None,
        confidence_min: float = 0,
        from_: int = 0,
        size: int = 20
    ) -> Dict[str, Any]:
        """Search indicators of compromise"""
        
        must_queries = []
        
        if value:
            must_queries.append({
                "multi_match": {
                    "query": value,
                    "fields": ["value^3", "description"],
                    "fuzziness": "AUTO"
                }
            })
        
        if type:
            must_queries.append({
                "term": {"type": type}
            })
        
        if confidence_min > 0:
            must_queries.append({
                "range": {"confidence": {"gte": confidence_min}}
            })
        
        search_body = {
            "query": {
                "bool": {
                    "must": must_queries if must_queries else [{"match_all": {}}]
                }
            },
            "from": from_,
            "size": size,
            "sort": [{"confidence": {"order": "desc"}}],
            "aggs": {
                "type_count": {
                    "terms": {"field": "type"}
                },
                "source_count": {
                    "terms": {"field": "source"}
                }
            }
        }
        
        try:
            response = await self.async_client.search(
                index=self.ioc_index,
                body=search_body
            )
            
            return {
                "total": response["hits"]["total"]["value"],
                "hits": [hit["_source"] for hit in response["hits"]["hits"]],
                "aggregations": response.get("aggregations", {})
            }
        except Exception as e:
            logger.error(f"IOC search failed: {e}")
            return {"total": 0, "hits": [], "error": str(e)}
    
    async def index_threat(self, threat: Dict[str, Any]) -> str:
        """Index a threat document"""
        try:
            # Generate ID if not present
            doc_id = threat.get("id") or hashlib.md5(
                f"{threat.get('source_ip')}{threat.get('timestamp')}".encode()
            ).hexdigest()
            
            # Add timestamp if missing
            if "timestamp" not in threat:
                threat["timestamp"] = datetime.utcnow().isoformat()
            
            response = await self.async_client.index(
                index=self.index,
                id=doc_id,
                document=threat
            )
            
            logger.info(f"Indexed threat: {doc_id}")
            return doc_id
        except Exception as e:
            logger.error(f"Failed to index threat: {e}")
            raise
    
    async def bulk_index_threats(self, threats: List[Dict[str, Any]]) -> int:
        """Bulk index multiple threats"""
        try:
            actions = []
            for threat in threats:
                doc_id = threat.get("id") or hashlib.md5(
                    f"{threat.get('source_ip')}{threat.get('timestamp')}".encode()
                ).hexdigest()
                
                actions.append({
                    "_index": self.index,
                    "_id": doc_id,
                    "_source": threat
                })
            
            success, failed = await async_bulk(
                self.async_client,
                actions,
                raise_on_error=False
            )
            
            logger.info(f"Bulk indexed {success} threats, {failed} failed")
            return success
        except Exception as e:
            logger.error(f"Bulk indexing failed: {e}")
            return 0
    
    async def delete_threat(self, doc_id: str) -> bool:
        """Delete a threat document"""
        try:
            response = await self.async_client.delete(
                index=self.index,
                id=doc_id
            )
            return response["result"] == "deleted"
        except Exception as e:
            logger.error(f"Failed to delete threat: {e}")
            return False
    
    async def get_suggestions(self, prefix: str) -> List[str]:
        """Get autocomplete suggestions"""
        try:
            response = await self.async_client.search(
                index=self.index,
                body={
                    "suggest": {
                        "ip_suggestions": {
                            "prefix": prefix,
                            "completion": {
                                "field": "source_ip_suggest",
                                "size": 5
                            }
                        },
                        "type_suggestions": {
                            "prefix": prefix,
                            "completion": {
                                "field": "type_suggest",
                                "size": 5
                            }
                        }
                    }
                }
            )
            
            suggestions = []
            for suggestion in response.get("suggest", {}).values():
                for option in suggestion[0].get("options", []):
                    suggestions.append(option["text"])
            
            return suggestions[:10]
        except Exception as e:
            logger.error(f"Suggestions failed: {e}")
            return []

# Global instance
search_service = SearchService()
