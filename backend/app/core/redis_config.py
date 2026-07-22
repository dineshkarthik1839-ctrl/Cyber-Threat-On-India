import os
import redis
from redis.connection import ConnectionPool
from typing import Optional
import logging
from datetime import datetime, timedelta
import json
import hashlib

logger = logging.getLogger(__name__)

class RedisConfig:
    """Complete Redis configuration with all required imports"""
    
    def __init__(self):
        self.host = os.getenv("REDIS_HOST", "localhost")
        self.port = int(os.getenv("REDIS_PORT", 6379))
        self.db = int(os.getenv("REDIS_DB", 0))
        self.password = os.getenv("REDIS_PASSWORD", None)
        self.max_connections = int(os.getenv("REDIS_MAX_CONNECTIONS", 50))
        self.socket_timeout = int(os.getenv("REDIS_SOCKET_TIMEOUT", 5))
        self.retry_on_timeout = True
        self.health_check_interval = 30
        
        self._pool: Optional[ConnectionPool] = None
        self._client: Optional[redis.Redis] = None
        
    def get_pool(self) -> ConnectionPool:
        if self._pool is None:
            self._pool = ConnectionPool(
                host=self.host,
                port=self.port,
                db=self.db,
                password=self.password,
                max_connections=self.max_connections,
                socket_timeout=self.socket_timeout,
                retry_on_timeout=self.retry_on_timeout,
                health_check_interval=self.health_check_interval
            )
        return self._pool
    
    def get_client(self) -> redis.Redis:
        if self._client is None:
            self._client = redis.Redis(
                connection_pool=self.get_pool(),
                decode_responses=True
            )
        return self._client
    
    def health_check(self) -> bool:
        try:
            return self.get_client().ping()
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return False
    
    def clear_all_cache(self) -> bool:
        """Clear all cache data"""
        try:
            self.get_client().flushdb()
            logger.info("All cache cleared")
            return True
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
            return False
    
    def get_cache_stats(self) -> dict:
        """Get cache statistics"""
        try:
            client = self.get_client()
            info = client.info()
            return {
                "used_memory": info.get("used_memory_human", "N/A"),
                "total_connections": info.get("total_connections_received", 0),
                "hit_rate": client.info("stats").get("keyspace_hits", 0) / 
                           max(client.info("stats").get("keyspace_misses", 1), 1),
                "connected_clients": info.get("connected_clients", 0)
            }
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {}

redis_config = RedisConfig()
