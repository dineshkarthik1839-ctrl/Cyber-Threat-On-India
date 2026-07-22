import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import patch, Mock
import json
from datetime import datetime, timedelta

from app.main import app
from app.core.redis_config import redis_config
from app.core.threat_cache_service import threat_cache
from app.core.exceptions import ThreatNotFoundError

client = TestClient(app)

class TestPhase1Integration:
    """Integration tests for Phase 1 components"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "services" in data
        assert "database" in data["services"]
        assert "redis" in data["services"]
    
    def test_redis_connection(self):
        """Test Redis connection"""
        assert redis_config.health_check() == True
        stats = redis_config.get_cache_stats()
        assert "used_memory" in stats
        assert "hit_rate" in stats
    
    @pytest.mark.asyncio
    async def test_cache_threats(self):
        """Test threat caching"""
        test_threats = [
            {"id": "test-1", "type": "malware", "severity": "high"},
            {"id": "test-2", "type": "ransomware", "severity": "critical"}
        ]
        
        # Set cache
        await threat_cache.set_threats(test_threats, {"test": True})
        
        # Get cache
        cached = await threat_cache.get_threats({"test": True})
        assert cached is not None
        assert len(cached) == 2
        assert cached[0]["id"] == "test-1"
        
        # Invalidate cache
        await threat_cache.invalidate_threats()
        cached_after = await threat_cache.get_threats({"test": True})
        assert cached_after is None
    
    def test_error_handling(self):
        """Test error handling middleware"""
        # Test 404 error
        response = client.get("/api/threats/non-existent")
        assert response.status_code == 404
        data = response.json()
        assert "error" in data
        
        # Test validation error
        response = client.post("/api/threats", json={})
        assert response.status_code == 422
        data = response.json()
        assert "Validation failed" in data.get("error", "") or "VALIDATION_ERROR" in data.get("code", "")
    
    def test_performance_middleware(self):
        """Test performance middleware"""
        # Test compression
        response = client.get("/", headers={"accept-encoding": "gzip"})
        assert response.status_code == 200
        # Response should be compressed if large enough
        
# Run tests with: pytest backend/tests/test_integration.py -v
