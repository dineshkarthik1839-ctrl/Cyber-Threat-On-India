import os
from elasticsearch import Elasticsearch, AsyncElasticsearch
from elasticsearch.helpers import bulk, async_bulk
from typing import Optional, List, Dict, Any
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class ElasticsearchConfig:
    """Elasticsearch configuration and connection management"""
    
    def __init__(self):
        self.host = os.getenv("ELASTICSEARCH_HOST", "localhost")
        self.port = int(os.getenv("ELASTICSEARCH_PORT", 9200))
        self.scheme = os.getenv("ELASTICSEARCH_SCHEME", "http")
        self.username = os.getenv("ELASTICSEARCH_USERNAME", None)
        self.password = os.getenv("ELASTICSEARCH_PASSWORD", None)
        self.verify_certs = os.getenv("ELASTICSEARCH_VERIFY_CERTS", "false").lower() == "true"
        
        self.index_prefix = os.getenv("ELASTICSEARCH_INDEX_PREFIX", "ictip")
        self.index_names = {
            "threats": f"{self.index_prefix}_threats",
            "iocs": f"{self.index_prefix}_iocs",
            "incidents": f"{self.index_prefix}_incidents",
            "alerts": f"{self.index_prefix}_alerts",
            "geodata": f"{self.index_prefix}_geodata"
        }
        
        self._client = None
        self._async_client = None
        
    def get_client(self) -> Elasticsearch:
        """Get synchronous Elasticsearch client"""
        if self._client is None:
            self._client = Elasticsearch(
                hosts=[f"{self.scheme}://{self.host}:{self.port}"],
                basic_auth=(self.username, self.password) if self.username else None,
                verify_certs=self.verify_certs,
                request_timeout=30,
                max_retries=3,
                retry_on_timeout=True
            )
        return self._client
    
    def get_async_client(self) -> AsyncElasticsearch:
        """Get asynchronous Elasticsearch client"""
        if self._async_client is None:
            self._async_client = AsyncElasticsearch(
                hosts=[f"{self.scheme}://{self.host}:{self.port}"],
                basic_auth=(self.username, self.password) if self.username else None,
                verify_certs=self.verify_certs,
                request_timeout=30,
                max_retries=3,
                retry_on_timeout=True
            )
        return self._async_client
    
    def health_check(self) -> bool:
        """Check Elasticsearch health"""
        try:
            client = self.get_client()
            return client.ping()
        except Exception as e:
            logger.error(f"Elasticsearch health check failed: {e}")
            return False
    
    def get_cluster_health(self) -> Dict:
        """Get cluster health information"""
        try:
            client = self.get_client()
            return client.cluster.health()
        except Exception as e:
            logger.error(f"Failed to get cluster health: {e}")
            return {}

# Global instance
es_config = ElasticsearchConfig()
