from app.services.scoring import compute_match_score


def test_compute_match_score_returns_weighted_breakdown() -> None:
    cv_data = {
        "skills": [
            {"skill": "python", "years": 4},
            {"skill": "fastapi", "years": 3},
            {"skill": "postgresql", "years": 3},
        ],
        "education": [{"degree": "Bachelor", "gpa": 3.4}],
        "certifications": ["AWS"],
        "languages": [{"language": "English", "level": "B2"}],
        "raw_text": "portfolio github",
    }
    jd_data = {
        "required_skills": [
            {"skill": "python", "is_mandatory": True, "years_required": 2},
            {"skill": "fastapi", "is_mandatory": True, "years_required": 1},
        ],
        "preferred_skills": [{"skill": "docker"}],
        "min_experience_years": 2,
        "education_requirement": {"min_degree": "bachelor", "preferred_majors": ["computer science"]},
    }
    result = compute_match_score(cv_data, jd_data)
    assert result["overall_score"] > 0
    assert result["breakdown"]["skill_score"] >= 60
    assert isinstance(result["matched_skills"], list)
    assert "explanation" in result
