from app.services.parsers import parse_cv, parse_jd


def test_parse_cv_extracts_personal_info_and_skills() -> None:
    cv_text = """
    Nguyen Van A
    Email: vana@example.com
    Phone: 0912345678
    Skills: Python, FastAPI, PostgreSQL, Docker
    4 years backend experience
    """
    result = parse_cv(cv_text)
    assert result["personal_info"]["email"] == "vana@example.com"
    assert result["personal_info"]["phone"] == "0912345678"
    skill_names = [item["skill"] for item in result["skills"]]
    assert "python" in skill_names
    assert "fastapi" in skill_names


def test_parse_jd_extracts_required_and_level() -> None:
    jd_text = "Senior backend engineer requires Python 3 years, FastAPI 2 years, PostgreSQL. Preferred Docker."
    result = parse_jd(jd_text)
    required = [item["skill"] for item in result["required_skills"]]
    assert "python" in required
    assert result["job_level"] == "senior"
