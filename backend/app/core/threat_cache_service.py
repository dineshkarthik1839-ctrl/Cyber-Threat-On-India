import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from app.core.redis_config import redis_config

logger = logging.getLogger(__name__)

class ThreatCacheService:
    """Complete threat cache service with all imports"""
    
    CACHE_TTL = {
        "threats": 300,  # 5 minutes
        "ioc": 3600,     # 1 hour
        "stats": 60,     # 1 minute
        "geodata": 86400 # 24 hours
    }
    
    @classmethod
    async def get_threats(cls, filters: Optional[Dict] = None) -> Optional[List[Dict]]:
        """Get cached threats"""
        try:
            key = cls._generate_key("threats", filters)
            client = redis_config.get_client()
            data = client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting cached threats: {e}")
            return None
    
    @classmethod
    async def set_threats(cls, threats: List[Dict], filters: Optional[Dict] = None):
        """Cache threats"""
        try:
            key = cls._generate_key("threats", filters)
            client = redis_config.get_client()
            client.setex(
                key,
                cls.CACHE_TTL["threats"],
                json.dumps(threats)
            )
        except Exception as e:
            logger.error(f"Error caching threats: {e}")
    
    @classmethod
    async def get_ioc(cls, ioc_value: str) -> Optional[Dict]:
        """Get cached IOC data"""
        try:
            key = f"ioc:{hashlib.md5(ioc_value.encode()).hexdigest()}"
            client = redis_config.get_client()
            data = client.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Error getting cached IOC: {e}")
            return None
    
    @classmethod
    async def set_ioc(cls, ioc_value: str, data: Dict):
        """Cache IOC data"""
        try:
            key = f"ioc:{hashlib.md5(ioc_value.encode()).hexdigest()}"
            client = redis_config.get_client()
            client.setex(
                key,
                cls.CACHE_TTL["ioc"],
                json.dumps(data)
            )
        except Exception as e:
            logger.error(f"Error caching IOC: {e}")
    
    @classmethod
    async def invalidate_threats(cls, threat_id: Optional[str] = None):
        """Invalidate threat cache"""
        try:
            client = redis_config.get_client()
            if threat_id:
                client.delete(f"threat:{threat_id}")
            # Invalidate all threat caches
            keys = client.keys("threats:*")
            if keys:
                client.delete(*keys)
            logger.info(f"Invalidated threat caches: {len(keys) if keys else 0} keys")
        except Exception as e:
            logger.error(f"Error invalidating threat cache: {e}")
    
    @classmethod
    def _generate_key(cls, prefix: str, filters: Optional[Dict] = None) -> str:
        """Generate cache key with filters"""
        if filters:
            filter_str = json.dumps(filters, sort_keys=True)
            return f"{prefix}:{hashlib.md5(filter_str.encode()).hexdigest()}"
        return prefix

# Singleton instance
threat_cache = ThreatCacheService()
