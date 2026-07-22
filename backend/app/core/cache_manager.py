import functools
import json
import logging
from typing import Callable, Any, Optional
from app.core.redis_config import RedisManager

logger = logging.getLogger(__name__)

def cache_result(prefix: str, ttl: int = 300):
    """
    Decorator to cache the result of an async function.
    The cache key is generated from the prefix and the function arguments.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            client = RedisManager.get_client()
            if not client:
                logger.warning("Redis client not available, bypassing cache.")
                return await func(*args, **kwargs)

            # Generate a cache key based on args and kwargs
            # Simple stringification (for complex objects, this needs custom serialization)
            key_parts = [prefix]
            if args:
                key_parts.extend([str(a) for a in args if not hasattr(a, 'request')]) # Skip fastAPI request objects
            if kwargs:
                key_parts.extend([f"{k}:{v}" for k, v in sorted(kwargs.items())])
            
            cache_key = ":".join(key_parts)
            
            try:
                cached_data = await client.get(cache_key)
                if cached_data:
                    logger.debug(f"Cache hit for {cache_key}")
                    return json.loads(cached_data)
            except Exception as e:
                logger.error(f"Redis get error on {cache_key}: {e}")

            # Execute function
            result = await func(*args, **kwargs)

            # Store result in cache
            if result is not None:
                try:
                    # Serialize the result (assumes dict or pydantic model returning dict)
                    if hasattr(result, 'model_dump'):
                        serialized = result.model_dump()
                    else:
                        serialized = result
                    
                    await client.setex(cache_key, ttl, json.dumps(serialized))
                    logger.debug(f"Cache set for {cache_key}")
                except Exception as e:
                    logger.error(f"Redis set error on {cache_key}: {e}")
                    
            return result
        return wrapper
    return decorator

async def invalidate_cache(prefix: str, exact: bool = False):
    """
    Invalidates keys matching the prefix.
    If exact=True, deletes only the key matching exactly.
    Otherwise, uses scan to delete all keys starting with prefix.
    """
    client = RedisManager.get_client()
    if not client:
        return
        
    try:
        if exact:
            await client.delete(prefix)
            logger.info(f"Invalidated exact cache key: {prefix}")
        else:
            cursor = '0'
            pattern = f"{prefix}*"
            keys_to_delete = []
            while cursor != 0:
                cursor, keys = await client.scan(cursor=cursor, match=pattern, count=100)
                keys_to_delete.extend(keys)
            
            if keys_to_delete:
                await client.delete(*keys_to_delete)
                logger.info(f"Invalidated {len(keys_to_delete)} cache keys matching pattern: {pattern}")
    except Exception as e:
        logger.error(f"Redis invalidate error on {prefix}: {e}")
