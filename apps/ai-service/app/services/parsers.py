import re
from datetime import datetime
from typing import Any, Dict, List

SKILL_ALIASES = {
    "js": "javascript",
    "reactjs": "react",
    "nodejs": "node.js",
    "postgres": "postgresql",
    "ml": "machine learning",
}

KNOWN_SKILLS = {
    "python",
    "fastapi",
    "nestjs",
    "node.js",
    "react",
    "next.js",
    "postgresql",
    "redis",
    "docker",
    "kubernetes",
    "java",
    "typescript",
    "javascript",
    "machine learning",
    "nlp",
    "spacy",
    "sentence-transformers",
}

DEGREE_PRIORITY = {
    "highschool": 0,
    "associate": 1,
    "bachelor": 2,
    "master": 3,
    "phd": 4,
}


def _normalize_skill(value: str) -> str:
    lowered = value.strip().lower()
    lowered = re.sub(r"[^a-z0-9.+#\-\s]", "", lowered)
    return SKILL_ALIASES.get(lowered, lowered)


def _extract_email(text: str) -> str:
    match = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
    return match.group(0) if match else ""


def _extract_phone(text: str) -> str:
    match = re.search(r"(\+?84|0)\d{8,10}", re.sub(r"\s+", "", text))
    return match.group(0) if match else ""


def _extract_name(text: str) -> str:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    if not lines:
        return "Unknown Candidate"
    first_line = lines[0]
    if len(first_line.split()) >= 2 and len(first_line) < 80:
        return first_line
    return "Unknown Candidate"


def _extract_years(text: str) -> float:
    years = re.findall(r"(\d+(?:\.\d+)?)\s*(?:years|năm)", text.lower())
    if not years:
        return 0.0
    return max(float(year) for year in years)


def _extract_skills(text: str) -> List[Dict[str, Any]]:
    lowered = text.lower()
    skills: List[Dict[str, Any]] = []

    for raw_skill in KNOWN_SKILLS:
        if raw_skill in lowered:
            years = _extract_years(text)
            level = "advanced" if years >= 4 else "intermediate" if years >= 2 else "beginner"
            skills.append({"skill": raw_skill, "level": level, "years": years or 1})

    unique: Dict[str, Dict[str, Any]] = {}
    for skill in skills:
        normalized = _normalize_skill(skill["skill"])
        unique[normalized] = {**skill, "skill": normalized}

    return list(unique.values())


def _extract_education(text: str) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    lines = text.splitlines()
    current_year = datetime.now().year
    for line in lines:
        lowered = line.lower()
        if any(keyword in lowered for keyword in ["university", "đại học", "college"]):
            graduation_year_match = re.search(r"(19|20)\d{2}", lowered)
            graduation_year = int(graduation_year_match.group(0)) if graduation_year_match else current_year
            rows.append(
                {
                    "school": line.strip(),
                    "degree": "Bachelor",
                    "major": "Computer Science",
                    "gpa": None,
                    "graduation_year": graduation_year,
                }
            )
    return rows


def parse_cv(raw_text: str) -> Dict[str, Any]:
    skills = _extract_skills(raw_text)
    return {
        "personal_info": {
            "name": _extract_name(raw_text),
            "email": _extract_email(raw_text),
            "phone": _extract_phone(raw_text),
            "address": "",
            "linkedin_url": "",
        },
        "skills": skills,
        "work_experience": [],
        "education": _extract_education(raw_text),
        "certifications": [],
        "languages": [{"language": "Vietnamese", "level": "native"}],
        "raw_text": raw_text,
    }


def parse_jd(jd_text: str) -> Dict[str, Any]:
    lowered = jd_text.lower()
    required_skills: List[Dict[str, Any]] = []
    preferred_skills: List[Dict[str, Any]] = []
    keywords: List[str] = []

    mandatory_section = re.split(r"preferred|nice to have|ưu tiên", lowered)[0]
    for token in re.split(r"[\s,;/\-]+", lowered):
        cleaned = _normalize_skill(token)
        if len(cleaned) < 2:
            continue
        keywords.append(cleaned)
        if cleaned in KNOWN_SKILLS:
            if cleaned in mandatory_section:
                years_required = 0
                years_match = re.search(rf"{re.escape(cleaned)}.{0,20}(\d+)\s*(?:years|năm)", mandatory_section)
                if years_match:
                    years_required = int(years_match.group(1))
                required_skills.append(
                    {"skill": cleaned, "is_mandatory": True, "years_required": years_required}
                )
            else:
                preferred_skills.append({"skill": cleaned})

    if not required_skills:
        required_skills = [{"skill": "communication", "is_mandatory": True, "years_required": 0}]

    min_exp_match = re.search(r"(\d+)\s*(?:years|năm).{0,10}(?:experience|kinh nghiệm)", lowered)
    min_experience_years = int(min_exp_match.group(1)) if min_exp_match else 1

    job_level = "junior"
    for level in ["intern", "fresher", "junior", "mid", "senior", "lead", "manager"]:
        if level in lowered:
            job_level = level
            break

    return {
        "required_skills": required_skills,
        "preferred_skills": list({item["skill"]: item for item in preferred_skills}.values()),
        "min_experience_years": min_experience_years,
        "education_requirement": {"min_degree": "bachelor", "preferred_majors": ["computer science"]},
        "salary_range": {"min": 0, "max": 0, "currency": "VND"},
        "keywords": list(dict.fromkeys(keywords)),
        "job_level": job_level,
    }


def degree_satisfies(min_degree: str, candidate_degree: str) -> bool:
    return DEGREE_PRIORITY.get(candidate_degree.lower(), 0) >= DEGREE_PRIORITY.get(min_degree.lower(), 0)
