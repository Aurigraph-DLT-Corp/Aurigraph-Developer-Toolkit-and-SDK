"""
Centralized Caching Layer with Redis
Provides caching strategies, invalidation, and distributed caching
"""
import redis.asyncio as redis
import json
import pickle
from typing import Any, Optional
from functools import wraps
import hashlib
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")

class CacheManager:
    """Centralized cache management with Redis"""
    
    def __init__(self):
        self.redis_client = None
    
    async def initialize(self):
        """Initialize Redis connection"""
        self.redis_client = await redis.from_url(
            REDIS_URL,
            encoding="utf-8",
            decode_responses=False
        )
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis_client:
            return None
        
        value = await self.redis_client.get(key)
        if value:
            try:
                return pickle.loads(value)
            except:
                return json.loads(value)
        return None
    
    async def set(self, key: str, value: Any, ttl: int = 3600):
        """Set value in cache with TTL"""
        if not self.redis_client:
            return
        
        try:
            serialized = pickle.dumps(value)
        except:
            serialized = json.dumps(value).encode()
        
        await self.redis_client.setex(key, ttl, serialized)
    
    async def delete(self, key: str):
        """Delete key from cache"""
        if self.redis_client:
            await self.redis_client.delete(key)
    
    async def clear_pattern(self, pattern: str):
        """Clear all keys matching pattern"""
        if not self.redis_client:
            return
        
        cursor = 0
        while True:
            cursor, keys = await self.redis_client.scan(cursor, match=pattern)
            if keys:
                await self.redis_client.delete(*keys)
            if cursor == 0:
                break
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()

# Caching decorator
def cached(ttl: int = 3600, key_prefix: str = ""):
    """Decorator for caching function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key_parts = [key_prefix, func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}:{v}" for k, v in sorted(kwargs.items()))
            cache_key = hashlib.md5(":".join(key_parts).encode()).hexdigest()
            
            # Try to get from cache
            result = await cache_manager.get(cache_key)
            if result is not None:
                return result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await cache_manager.set(cache_key, result, ttl)
            return result
        
        return wrapper
    return decorator

# Global instance
cache_manager = CacheManager()

__all__ = ["CacheManager", "cache_manager", "cached"]