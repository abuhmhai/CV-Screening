import hashlib
import time
from typing import Any, Dict

from app.services.parsers import parse_cv, parse_jd
from app.services.scoring import compute_match_score


def build_cache_key(cv_content: str, jd_text: str, job_id: str | None = None) -> str:
    payload = f"{cv_content}|{jd_text}|{job_id or ''}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def screen_candidate(cv_content: str, jd_text: str) -> Dict[str, Any]:
    start = time.time()
    cv_data = parse_cv(cv_content)
    jd_data = parse_jd(jd_text)
    result = compute_match_score(cv_data, jd_data)
    elapsed = int((time.time() - start) * 1000)
    result["processing_time_ms"] = elapsed
    return result
