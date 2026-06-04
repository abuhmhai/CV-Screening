"""CV-vs-job screening endpoint consumed by the NestJS ExternalJobs module."""
from fastapi import APIRouter

from app.schemas import CvScreenRequest, CvScreenResponse
from app.services.llm_screening import screen_cv

router = APIRouter(prefix="/screening", tags=["screening"])


@router.post("/cv", response_model=CvScreenResponse)
async def screen_cv_endpoint(request: CvScreenRequest) -> dict:
    return screen_cv(
        jd=request.jd,
        company=request.company or "",
        skills=request.skills,
        cv=request.cv,
        job_id=request.job_id,
    )
