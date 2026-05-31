from typing import Any, Dict, List, Tuple

from app.services.parsers import _normalize_skill, degree_satisfies


def _grade(score: float) -> Tuple[str, str]:
    if score >= 90:
        return "A+", "Strongly recommend for interview"
    if score >= 85:
        return "A", "Strongly recommend for interview"
    if score >= 75:
        return "B+", "Recommend for interview"
    if score >= 65:
        return "B", "Consider for interview"
    if score >= 50:
        return "C", "Need manual recruiter review"
    return "D", "Not recommended"


def _score_skills(cv_data: Dict[str, Any], jd_data: Dict[str, Any]) -> Tuple[float, List[str], List[str], List[Dict[str, str]]]:
    cv_skills = {_normalize_skill(item["skill"]) for item in cv_data.get("skills", [])}
    required = [_normalize_skill(item["skill"]) for item in jd_data.get("required_skills", [])]
    preferred = [_normalize_skill(item["skill"]) for item in jd_data.get("preferred_skills", [])]

    matched_required = [skill for skill in required if skill in cv_skills]
    missing_required = [skill for skill in required if skill not in cv_skills]
    matched_preferred = [skill for skill in preferred if skill in cv_skills]
    missing_preferred = [skill for skill in preferred if skill not in cv_skills]

    required_ratio = len(matched_required) / len(required) if required else 1.0
    preferred_ratio = len(matched_preferred) / len(preferred) if preferred else 1.0
    score = round((required_ratio * 0.8 + preferred_ratio * 0.2) * 100, 2)

    gaps = [{"skill": skill, "importance": "mandatory"} for skill in missing_required] + [
        {"skill": skill, "importance": "preferred"} for skill in missing_preferred
    ]
    matched = sorted(list(set(matched_required + matched_preferred)))
    missing = sorted(list(set(missing_required + missing_preferred)))
    return score, matched, missing, gaps


def _score_experience(cv_data: Dict[str, Any], jd_data: Dict[str, Any]) -> Tuple[float, Dict[str, Any]]:
    skill_years = [float(item.get("years", 0)) for item in cv_data.get("skills", []) if item.get("years") is not None]
    actual_years = max(skill_years) if skill_years else 0.0
    required_years = float(jd_data.get("min_experience_years", 1))
    if required_years <= 0:
        score = 100.0
    else:
        ratio = min(actual_years / required_years, 1.3)
        score = round(min(ratio * 100, 100), 2)

    analysis = {
        "required_years": required_years,
        "actual_years": round(actual_years, 2),
        "relevant_experience": "Relevant software engineering delivery across product teams",
    }
    return score, analysis


def _score_education(cv_data: Dict[str, Any], jd_data: Dict[str, Any]) -> float:
    min_degree = jd_data.get("education_requirement", {}).get("min_degree", "bachelor")
    education_rows = cv_data.get("education", [])
    if not education_rows:
        return 50.0

    candidate_degree = education_rows[0].get("degree", "bachelor")
    base = 80.0 if degree_satisfies(min_degree, candidate_degree) else 60.0

    gpa = education_rows[0].get("gpa")
    if gpa is not None:
        try:
            gpa_val = float(gpa)
            if gpa_val >= 3.2:
                base += 10.0
        except ValueError:
            pass
    return min(base, 100.0)


def _score_other(cv_data: Dict[str, Any]) -> float:
    score = 60.0
    if cv_data.get("certifications"):
        score += 15
    if cv_data.get("languages"):
        score += 10
    if "github" in cv_data.get("raw_text", "").lower() or "portfolio" in cv_data.get("raw_text", "").lower():
        score += 15
    return min(score, 100.0)


def compute_match_score(cv_data: Dict[str, Any], jd_data: Dict[str, Any]) -> Dict[str, Any]:
    skill_score, matched_skills, missing_skills, skill_gaps = _score_skills(cv_data, jd_data)
    experience_score, experience_analysis = _score_experience(cv_data, jd_data)
    education_score = _score_education(cv_data, jd_data)
    other_score = _score_other(cv_data)

    overall_score = round(
        skill_score * 0.4 + experience_score * 0.3 + education_score * 0.2 + other_score * 0.1,
        2,
    )
    grade, recommendation = _grade(overall_score)

    strengths: List[str] = []
    concerns: List[str] = []
    if skill_score >= 75:
        strengths.append("Strong alignment with required technical skills")
    if experience_score >= 75:
        strengths.append("Relevant years of experience for the role")
    if education_score >= 80:
        strengths.append("Education profile meets job expectations")

    if missing_skills:
        concerns.append("Some required/preferred skills are missing")
    if experience_score < 60:
        concerns.append("Experience depth may be below requirement")
    if not concerns:
        concerns.append("No major risk identified in automated screening")

    return {
        "overall_score": overall_score,
        "grade": grade,
        "recommendation": recommendation,
        "breakdown": {
            "skill_score": skill_score,
            "experience_score": experience_score,
            "education_score": education_score,
            "other_score": other_score,
        },
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "skill_gaps": skill_gaps,
        "experience_analysis": experience_analysis,
        "strengths": strengths,
        "concerns": concerns,
        "explanation": "Weighted scoring based on skills(40%), experience(30%), education(20%), others(10%).",
        "model_version": "cv-screener-v1.0.0",
    }
