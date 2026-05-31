from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ScoreBreakdown(BaseModel):
    skill_score: float
    experience_score: float
    education_score: float
    other_score: float


class SkillGap(BaseModel):
    skill: str
    importance: str


class ExperienceAnalysis(BaseModel):
    required_years: float
    actual_years: float
    relevant_experience: str


class ScreeningResponse(BaseModel):
    overall_score: float
    grade: str
    recommendation: str
    breakdown: ScoreBreakdown
    matched_skills: List[str]
    missing_skills: List[str]
    skill_gaps: List[SkillGap]
    experience_analysis: ExperienceAnalysis
    strengths: List[str]
    concerns: List[str]
    explanation: str
    model_version: str
    processing_time_ms: int
    cached_key: str


class ScreenRequest(BaseModel):
    cv_url: Optional[str] = None
    jd_text: str = Field(..., min_length=10)
    job_id: Optional[str] = None
    cv_data: Optional[Dict[str, Any]] = None
