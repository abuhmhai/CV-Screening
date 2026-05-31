import json
from typing import Any, Dict, Optional

from redis import Redis


class ScreeningCache:
    def __init__(self, redis_client: Redis, ttl_seconds: int) -> None:
        self.redis_client = redis_client
        self.ttl_seconds = ttl_seconds

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        payload = self.redis_client.get(key)
        if not payload:
            return None
        return json.loads(payload)

    def set(self, key: str, value: Dict[str, Any]) -> None:
        self.redis_client.setex(key, self.ttl_seconds, json.dumps(value))
