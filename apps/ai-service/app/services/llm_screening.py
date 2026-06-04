"""CV vs JD screening that prefers Anthropic Claude when an API key is
configured, and gracefully falls back to the local heuristic scorer otherwise.

The response shape is stable regardless of engine:
    { score, verdict, strengths[], gaps[], suggestion,
      keywords_matched[], keywords_missing[] }
"""
import json
import logging
import os
from typing import Any, Dict, List

from app.services.screening import screen_candidate

logger = logging.getLogger(__name__)

ANTHROPIC_MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS = 1500

SYSTEM_PROMPT = (
    "You are TalentFlow's AI HR assistant. Analyze the candidate's CV against "
    "the job description and return a JSON screening report. Be objective, "
    "specific, and constructive. Return ONLY valid JSON, no markdown."
)

# Vietnamese verdict thresholds shared by both engines.
VERDICT_HIGH = "Phù hợp cao"
VERDICT_OK = "Phù hợp"
VERDICT_IMPROVE = "Cần cải thiện"
VERDICT_NO = "Không phù hợp"


def verdict_for(score: int) -> str:
    if score >= 80:
        return VERDICT_HIGH
    if score >= 65:
        return VERDICT_OK
    if score >= 50:
        return VERDICT_IMPROVE
    return VERDICT_NO


def screen_cv(jd: str, company: str, skills: List[str], cv: str, job_id: str | None = None) -> Dict[str, Any]:
    """Entry point used by the /screening/cv route."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        try:
            return _screen_with_anthropic(api_key, jd, company, skills, cv)
        except Exception as exc:  # noqa: BLE001 - any failure must fall back
            logger.warning("Anthropic screening failed, falling back to local scorer: %s", exc)

    return _screen_with_local(jd, skills, cv)


def _screen_with_anthropic(
    api_key: str, jd: str, company: str, skills: List[str], cv: str
) -> Dict[str, Any]:
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    user_prompt = _build_user_prompt(jd, company, skills, cv)

    message = client.messages.create(
        model=ANTHROPIC_MODEL,
        max_tokens=MAX_TOKENS,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_prompt}],
    )

    text = "".join(block.text for block in message.content if getattr(block, "type", None) == "text")
    report = _safe_json(text)
    if report is None:
        logger.warning("Anthropic returned non-JSON output, falling back to local scorer")
        return _screen_with_local(jd, skills, cv)

    return _normalize_report(report, skills)


def _build_user_prompt(jd: str, company: str, skills: List[str], cv: str) -> str:
    skills_line = ", ".join(skills) if skills else "(không có danh sách kỹ năng yêu cầu)"
    return (
        "Đánh giá mức độ phù hợp của CV ứng viên với công việc dưới đây. "
        "Trả lời bằng tiếng Việt cho các trường văn bản.\n\n"
        f"Công ty: {company or 'N/A'}\n"
        f"Kỹ năng yêu cầu: {skills_line}\n\n"
        f"--- MÔ TẢ CÔNG VIỆC ---\n{jd}\n\n"
        f"--- CV ỨNG VIÊN ---\n{cv}\n\n"
        "Trả về DUY NHẤT một object JSON với cấu trúc:\n"
        "{\n"
        '  "score": <số nguyên 0-100>,\n'
        '  "verdict": "Phù hợp cao" | "Phù hợp" | "Cần cải thiện" | "Không phù hợp",\n'
        '  "strengths": [<chuỗi>],\n'
        '  "gaps": [<chuỗi>],\n'
        '  "suggestion": <chuỗi>,\n'
        '  "keywords_matched": [<chuỗi>],\n'
        '  "keywords_missing": [<chuỗi>]\n'
        "}"
    )


def _safe_json(text: str) -> Dict[str, Any] | None:
    text = (text or "").strip()
    if not text:
        return None
    # Strip accidental markdown code fences.
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Best-effort: extract the outermost JSON object.
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start : end + 1])
            except json.JSONDecodeError:
                return None
        return None


def _normalize_report(report: Dict[str, Any], skills: List[str]) -> Dict[str, Any]:
    try:
        score = int(round(float(report.get("score", 0))))
    except (TypeError, ValueError):
        score = 0
    score = max(0, min(100, score))

    verdict = report.get("verdict") or verdict_for(score)

    def as_list(value: Any) -> List[str]:
        if isinstance(value, list):
            return [str(item) for item in value if str(item).strip()]
        if isinstance(value, str) and value.strip():
            return [value.strip()]
        return []

    return {
        "score": score,
        "verdict": str(verdict),
        "strengths": as_list(report.get("strengths")),
        "gaps": as_list(report.get("gaps")),
        "suggestion": str(report.get("suggestion") or ""),
        "keywords_matched": as_list(report.get("keywords_matched")),
        "keywords_missing": as_list(report.get("keywords_missing")) or list(skills),
    }


def _screen_with_local(jd: str, skills: List[str], cv: str) -> Dict[str, Any]:
    jd_text = jd
    if skills:
        jd_text = f"{jd}\nRequired skills: {', '.join(skills)}"

    result = screen_candidate(cv_content=cv, jd_text=jd_text)
    score = int(round(float(result.get("overall_score", 0))))

    return {
        "score": score,
        "verdict": verdict_for(score),
        "strengths": list(result.get("strengths", [])),
        "gaps": list(result.get("concerns", [])),
        "suggestion": str(result.get("explanation", "")),
        "keywords_matched": list(result.get("matched_skills", [])),
        "keywords_missing": list(result.get("missing_skills", [])),
    }
