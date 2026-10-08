import json
import os
import tempfile
import time
from pathlib import Path
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


class FileScreeningCache:
    """TTL cache for the PHP/local runtime, without a Redis dependency."""

    def __init__(self, directory: str, ttl_seconds: int) -> None:
        self.directory = Path(directory)
        self.directory.mkdir(parents=True, exist_ok=True)
        self.ttl_seconds = ttl_seconds

    def _path(self, key: str) -> Path:
        import hashlib
        return self.directory / (hashlib.sha256(key.encode()).hexdigest() + ".json")

    def get(self, key: str) -> Optional[Dict[str, Any]]:
        path = self._path(key)
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
            if payload["expires_at"] <= time.time():
                path.unlink(missing_ok=True)
                return None
            return payload["value"]
        except (OSError, ValueError, KeyError, TypeError):
            return None

    def set(self, key: str, value: Dict[str, Any]) -> None:
        descriptor, temporary = tempfile.mkstemp(dir=self.directory, suffix=".tmp")
        try:
            with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
                json.dump({"expires_at": time.time() + self.ttl_seconds, "value": value}, stream)
            os.replace(temporary, self._path(key))
        finally:
            if os.path.exists(temporary):
                os.unlink(temporary)
