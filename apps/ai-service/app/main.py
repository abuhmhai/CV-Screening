import os
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from redis import Redis

from app.schemas import ScreenRequest, ScreeningResponse
from app.services.cache import ScreeningCache
from app.services.extraction import extract_text
from app.services.screening import build_cache_key, screen_candidate

app = FastAPI(title="AI Screening Service", version="0.1.0")

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
cache_ttl = int(os.getenv("CACHE_TTL_SECONDS", "86400"))
redis_client = Redis.from_url(redis_url, decode_responses=True)
screen_cache = ScreeningCache(redis_client, cache_ttl)


def _decode_upload(content: bytes, filename: str) -> str:
    # Real extraction for PDF/DOCX with graceful UTF-8 fallback.
    return extract_text(content, filename)


def _validate_upload(file: UploadFile, content: bytes) -> None:
    allowed_types = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported CV file type. Use PDF or DOCX.")

    max_size = 5 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="CV file exceeds 5MB limit.")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "ai-service"}


@app.get("/status/{job_id}")
def status(job_id: str) -> dict:
    return {"job_id": job_id, "status": "completed"}


@app.post("/screen", response_model=ScreeningResponse)
async def screen(request: ScreenRequest) -> dict:
    cv_content = request.cv_data.get("raw_text", "") if request.cv_data else request.cv_url or "uploaded_cv"
    cache_key = build_cache_key(cv_content=cv_content, jd_text=request.jd_text, job_id=request.job_id)

    cached = screen_cache.get(cache_key)
    if cached:
        return {**cached, "cached_key": cache_key}

    result = screen_candidate(cv_content=cv_content, jd_text=request.jd_text)
    result["cached_key"] = cache_key
    screen_cache.set(cache_key, result)
    return result


@app.post("/api/v1/ai/screen", response_model=ScreeningResponse)
async def screen_v1(
    cv_file: Optional[UploadFile] = File(default=None),
    job_id: Optional[str] = Form(default=None),
    cv_url: Optional[str] = Form(default=None),
    jd_text: str = Form(default="")
) -> dict:
    if not jd_text:
        jd_text = "default jd text"

    if cv_file:
        file_content = await cv_file.read()
        _validate_upload(cv_file, file_content)
        content = _decode_upload(file_content, cv_file.filename or "candidate_cv.txt")
    else:
        content = cv_url or "uploaded_cv"

    cache_key = build_cache_key(cv_content=content, jd_text=jd_text, job_id=job_id)
    cached = screen_cache.get(cache_key)
    if cached:
        return {**cached, "cached_key": cache_key}

    result = screen_candidate(cv_content=content, jd_text=jd_text)
    result["cached_key"] = cache_key
    screen_cache.set(cache_key, result)
    return result
