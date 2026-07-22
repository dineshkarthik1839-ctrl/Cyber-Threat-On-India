from app.core.elasticsearch_config import es_config
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

class IndexManager:
    """Manage Elasticsearch indices"""
    
    @staticmethod
    def create_indices():
        """Create all required indices with mappings"""
        client = es_config.get_client()
        
        # Index mappings
        mappings = {
            "threats": {
                "mappings": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "type": {"type": "keyword"},
                        "severity": {"type": "keyword"},
                        "status": {"type": "keyword"},
                        "source_ip": {"type": "ip"},
                        "destination_ip": {"type": "ip"},
                        "source_country": {"type": "keyword"},
                        "destination_country": {"type": "keyword"},
                        "source_city": {"type": "keyword"},
                        "destination_city": {"type": "keyword"},
                        "description": {"type": "text", "analyzer": "standard"},
                        "mitre_tactic": {"type": "keyword"},
                        "mitre_technique": {"type": "keyword"},
                        "tags": {"type": "keyword"},
                        "timestamp": {"type": "date"},
                        "created_at": {"type": "date"},
                        "updated_at": {"type": "date"},
                        "location": {"type": "geo_point"},
                        "risk_score": {"type": "float"},
                        "confidence": {"type": "float"},
                        "metadata": {"type": "object", "enabled": True}
                    }
                },
                "settings": {
                    "number_of_shards": 2,
                    "number_of_replicas": 1,
                    "analysis": {
                        "analyzer": {
                            "ioc_analyzer": {
                                "type": "custom",
                                "tokenizer": "standard",
                                "filter": ["lowercase", "stop"]
                            }
                        }
                    }
                }
            },
            
            "iocs": {
                "mappings": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "type": {"type": "keyword"},
                        "value": {"type": "text", "analyzer": "ioc_analyzer"},
                        "value_raw": {"type": "keyword"},
                        "confidence": {"type": "float"},
                        "severity": {"type": "keyword"},
                        "tags": {"type": "keyword"},
                        "source": {"type": "keyword"},
                        "first_seen": {"type": "date"},
                        "last_seen": {"type": "date"},
                        "related_indicators": {"type": "keyword"},
                        "description": {"type": "text"},
                        "references": {"type": "text"}
                    }
                }
            },
            
            "incidents": {
                "mappings": {
                    "properties": {
                        "id": {"type": "keyword"},
                        "title": {"type": "text"},
                        "description": {"type": "text"},
                        "severity": {"type": "keyword"},
                        "status": {"type": "keyword"},
                        "assigned_to": {"type": "keyword"},
                        "created_at": {"type": "date"},
                        "updated_at": {"type": "date"},
                        "resolved_at": {"type": "date"},
                        "related_threats": {"type": "keyword"},
                        "tags": {"type": "keyword"},
                        "timeline": {"type": "object", "enabled": True}
                    }
                }
            }
        }
        
        # Create indices
        for index_name, config in mappings.items():
            full_name = es_config.index_names[index_name]
            try:
                if not client.indices.exists(index=full_name):
                    client.indices.create(index=full_name, body=config)
                    logger.info(f"Created index: {full_name}")
                else:
                    logger.info(f"Index already exists: {full_name}")
            except Exception as e:
                logger.error(f"Failed to create index {full_name}: {e}")
    
    @staticmethod
    def delete_indices():
        """Delete all indices (use with caution)"""
        client = es_config.get_client()
        for index_name in es_config.index_names.values():
            try:
                if client.indices.exists(index=index_name):
                    client.indices.delete(index=index_name)
                    logger.info(f"Deleted index: {index_name}")
            except Exception as e:
                logger.error(f"Failed to delete index {index_name}: {e}")
    
    @staticmethod
    def reindex(from_index: str, to_index: str):
        """Reindex data from one index to another"""
        client = es_config.get_client()
        try:
            client.reindex(body={
                "source": {"index": from_index},
                "dest": {"index": to_index}
            })
            logger.info(f"Reindexed from {from_index} to {to_index}")
        except Exception as e:
            logger.error(f"Reindex failed: {e}")
