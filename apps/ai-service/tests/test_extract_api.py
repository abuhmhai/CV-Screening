import io
import os

os.environ["CACHE_DRIVER"] = "file"

from docx import Document
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_extract_docx():
    document = Document()
    document.add_paragraph("PHP MySQL 3 years experience — Tiếng Việt")
    stream = io.BytesIO()
    document.save(stream)
    result = client.post("/extract", files={"file": ("cv.docx", stream.getvalue(), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")})
    assert result.status_code == 200
    assert "Tiếng Việt" in result.json()["text"]


def test_extract_rejects_missing_unsupported_and_oversized():
    assert client.post("/extract").status_code == 400
    assert client.post("/extract", files={"file": ("cv.txt", b"text", "text/plain")}).status_code == 400
    assert client.post("/extract", files={"file": ("cv.pdf", b"x" * (5 * 1024 * 1024 + 1), "application/pdf")}).status_code == 400
    assert client.post("/extract", files={"file": ("cv.pdf", b"broken PDF", "application/pdf")}).status_code == 422


def test_screen_works_without_redis():
    payload = {"cv_data": {"raw_text": "Python FastAPI MySQL 3 years experience"}, "jd_text": "Python FastAPI developer with 2 years experience", "job_id": "test"}
    first = client.post("/screen", json=payload)
    second = client.post("/screen", json=payload)
    assert first.status_code == second.status_code == 200
    assert first.json()["overall_score"] == second.json()["overall_score"]
