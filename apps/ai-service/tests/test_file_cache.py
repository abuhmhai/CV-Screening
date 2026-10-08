import time

from app.services.cache import FileScreeningCache


def test_roundtrip_and_expiration(tmp_path, monkeypatch):
    cache = FileScreeningCache(str(tmp_path), 10)
    cache.set("../../private", {"explanation": "Tiếng Việt"})
    assert cache.get("../../private") == {"explanation": "Tiếng Việt"}
    assert len(list(tmp_path.glob("*.json"))) == 1
    future = time.time() + 11
    monkeypatch.setattr(time, "time", lambda: future)
    assert cache.get("../../private") is None


def test_corrupt_payload_is_cache_miss(tmp_path):
    cache = FileScreeningCache(str(tmp_path), 10)
    cache.set("a", {"score": 70})
    next(tmp_path.glob("*.json")).write_text("broken", encoding="utf-8")
    assert cache.get("a") is None
