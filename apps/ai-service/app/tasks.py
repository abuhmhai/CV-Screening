"""Celery tasks for async AI screening.

Flow (Celery path):
  NestJS enqueues  →  Celery worker picks up  →  screen_candidate()
  →  write ai_screening_results to PostgreSQL
  →  update application status to HR_REVIEW
  →  publish notification to Redis pub/sub
  →  WebSocket gateway delivers to client
"""
import json
import os
from typing import Any, Dict

from app.celery_app import celery_app
from app.services.screening import build_cache_key, screen_candidate

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cvuser:cvpass@postgres:5432/cvscreening")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")


def _get_db_conn():
    """Return a psycopg2 connection to PostgreSQL."""
    import psycopg2  # type: ignore
    return psycopg2.connect(DATABASE_URL)


def _get_redis():
    """Return a redis client."""
    import redis  # type: ignore
    return redis.Redis.from_url(REDIS_URL, decode_responses=True)


@celery_app.task(name="app.tasks.screen_cv", bind=True, max_retries=3)
def screen_cv(self, application_id: str, cv_content: str, jd_text: str) -> Dict[str, Any]:
    """
    Full async screening task.

    Args:
        application_id: UUID of the Application row.
        cv_content: Raw text extracted from the candidate's CV file.
        jd_text: Full job description text.

    Returns:
        AI screening result dict.
    """
    try:
        result = screen_candidate(cv_content=cv_content, jd_text=jd_text)
        _persist_result(application_id, result)
        _publish_notification(application_id, result)
        return result
    except Exception as exc:
        raise self.retry(exc=exc, countdown=15)


def _persist_result(application_id: str, result: Dict[str, Any]) -> None:
    """Write AiScreeningResult and advance Application status in PostgreSQL."""
    conn = _get_db_conn()
    try:
        with conn:
            with conn.cursor() as cur:
                # Insert ai_screening_results
                cur.execute(
                    """
                    INSERT INTO ai_screening_results (
                        id, application_id,
                        overall_score, skill_score, experience_score,
                        education_score, other_score,
                        grade,
                        matched_skills, missing_skills, strengths, concerns,
                        explanation, model_version, processing_time_ms
                    ) VALUES (
                        gen_random_uuid(), %s,
                        %s, %s, %s, %s, %s,
                        %s,
                        %s::jsonb, %s::jsonb, %s::jsonb, %s::jsonb,
                        %s, %s, %s
                    )
                    ON CONFLICT (application_id) DO UPDATE SET
                        overall_score       = EXCLUDED.overall_score,
                        skill_score         = EXCLUDED.skill_score,
                        experience_score    = EXCLUDED.experience_score,
                        education_score     = EXCLUDED.education_score,
                        other_score         = EXCLUDED.other_score,
                        grade               = EXCLUDED.grade,
                        matched_skills      = EXCLUDED.matched_skills,
                        missing_skills      = EXCLUDED.missing_skills,
                        strengths           = EXCLUDED.strengths,
                        concerns            = EXCLUDED.concerns,
                        explanation         = EXCLUDED.explanation,
                        model_version       = EXCLUDED.model_version,
                        processing_time_ms  = EXCLUDED.processing_time_ms
                    """,
                    (
                        application_id,
                        result["overall_score"],
                        result["breakdown"]["skill_score"],
                        result["breakdown"]["experience_score"],
                        result["breakdown"]["education_score"],
                        result["breakdown"]["other_score"],
                        result["grade"],
                        json.dumps(result["matched_skills"]),
                        json.dumps(result["missing_skills"]),
                        json.dumps(result["strengths"]),
                        json.dumps(result["concerns"]),
                        result["explanation"],
                        result.get("model_version", "cv-screener-v1.0.0"),
                        result["processing_time_ms"],
                    ),
                )

                # Advance Application status → HR_REVIEW
                cur.execute(
                    """
                    UPDATE applications
                    SET status = 'HR_REVIEW'
                    WHERE id = %s AND status IN ('APPLIED', 'AI_SCREENING')
                    RETURNING candidate_id
                    """,
                    (application_id,),
                )
                row = cur.fetchone()
                if row is None:
                    return

                candidate_id = row[0]

                # Insert status history
                cur.execute(
                    """
                    INSERT INTO application_status_history
                        (application_id, from_status, to_status, changed_by, note, changed_at)
                    VALUES (%s, 'AI_SCREENING', 'HR_REVIEW', %s, %s, NOW())
                    """,
                    (
                        application_id,
                        candidate_id,
                        f"AI screening complete. Score: {result['overall_score']} ({result['grade']})",
                    ),
                )

                # Insert Notification row
                cur.execute(
                    """
                    INSERT INTO notifications (id, user_id, type, title, body, data, is_read, created_at)
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s::jsonb, false, NOW())
                    """,
                    (
                        candidate_id,
                        "AI_SCREENING_DONE",
                        "Kết quả AI Screening",
                        f"Điểm phù hợp: {result['overall_score']}/100 ({result['grade']}) — {result['recommendation']}",
                        json.dumps(
                            {
                                "applicationId": application_id,
                                "overallScore": result["overall_score"],
                                "grade": result["grade"],
                            }
                        ),
                    ),
                )

    finally:
        conn.close()


def _publish_notification(application_id: str, result: Dict[str, Any]) -> None:
    """Publish to Redis pub/sub so the NestJS WebSocket gateway delivers to client."""
    try:
        redis_client = _get_redis()

        # We need candidate_id from DB to target the correct WebSocket room
        conn = _get_db_conn()
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT candidate_id FROM applications WHERE id = %s",
                    (application_id,),
                )
                row = cur.fetchone()
        finally:
            conn.close()

        if row is None:
            return

        candidate_id = row[0]
        event = {
            "userId": candidate_id,
            "type": "AI_SCREENING_DONE",
            "payload": {
                "applicationId": application_id,
                "overallScore": result["overall_score"],
                "grade": result["grade"],
                "recommendation": result["recommendation"],
                "processingTimeMs": result["processing_time_ms"],
            },
        }
        redis_client.publish("notifications", json.dumps(event))
    except Exception:  # pylint: disable=broad-except
        pass  # Notification failure must not crash the task
