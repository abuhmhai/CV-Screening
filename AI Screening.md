You are an NLP and Machine Learning expert. I need you to design in detail the AI Screening module for a recruitment platform. This is the most critical and complex part of the thesis.

## MODULE OBJECTIVE
Accept input as CV (PDF/DOCX/LinkedIn URL) and Job Description (text), return a fit score 0-100 with detailed analysis so recruiters can understand why a candidate received that score.

## DETAILED REQUIREMENTS

### 1. CV PARSING (Python + spaCy)
Design parse_cv(file_path) function returning a dict with:
- personal_info: {name, email, phone, address, linkedin_url}
- skills: [{"skill": "Python", "level": "advanced", "years": 3}]
- work_experience: [{"company", "position", "start_date", "end_date", "description", "duration_months"}]
- education: [{"school", "degree", "major", "gpa", "graduation_year"}]
- certifications: [{"name", "issuer", "year"}]
- languages: [{"language", "level"}]
- raw_text: full CV string

Vietnamese-specific considerations:
- Vietnamese person name recognition (family + middle + given name)
- Vietnamese company name abbreviations (VNPT, VCB, MB Bank...)
- Skills written in English mixed with Vietnamese text
- Proper UTF-8 encoding handling for Vietnamese characters

### 2. JD PARSING
Design parse_jd(jd_text) returning a dict with:
- required_skills: [{"skill", "is_mandatory": bool, "years_required": int}]
- preferred_skills: [{"skill"}]
- min_experience_years: int
- education_requirement: {"min_degree", "preferred_majors": []}
- salary_range: {min, max, currency}
- keywords: [string]
- job_level: "intern/fresher/junior/mid/senior/lead/manager"

### 3. EMBEDDING & MATCHING (sentence-transformers)
Recommended model: paraphrase-multilingual-MiniLM-L12-v2 (supports Vietnamese)

Design compute_match_score(cv_data, jd_data) with:
a) Skill matching:
   - Exact match + fuzzy match (JavaScript vs JS, ReactJS vs React)
   - Semantic similarity for equivalent skills (TensorFlow vs PyTorch)
   - Weighted scoring: mandatory skills more important than preferred
b) Experience matching:
   - Compare actual years vs required years
   - Penalize for shortage, bonus for exceeding
   - Relevance of experience (same domain/industry)
c) Education matching:
   - Preferred major > related major > other major
   - GPA bonus if > 3.2/4.0
d) Score aggregation:
   - overall_score = skills*0.4 + experience*0.3 + education*0.2 + others*0.1
   - others: language bonus, certification bonus, portfolio bonus

### 4. OUTPUT JSON SCHEMA
{
  "overall_score": 78,
  "grade": "B+",
  "recommendation": "Recommend for interview",
  "breakdown": {
    "skill_score": 82,
    "experience_score": 75,
    "education_score": 80,
    "other_score": 70
  },
  "matched_skills": ["Python", "FastAPI", "PostgreSQL"],
  "missing_skills": ["Kubernetes", "Redis"],
  "skill_gaps": [{"skill": "Kubernetes", "importance": "preferred"}],
  "experience_analysis": {
    "required_years": 2,
    "actual_years": 3.5,
    "relevant_experience": "Backend development at tech companies"
  },
  "strengths": ["Strong Python background", "Relevant industry experience"],
  "concerns": ["No cloud deployment experience"],
  "processing_time_ms": 1240
}

### 5. API ENDPOINT
POST /api/v1/ai/screen
Request: multipart/form-data { cv_file, job_id } or { cv_url, jd_text }
Response: output schema above + cached_key

### 6. PERFORMANCE & SCALABILITY
- Model inference time target: < 3 seconds per request
- Caching: store results by hash(cv_content + job_id) in Redis for 24h
- Queue: Celery + Redis for background processing under high load
- Batch processing: handle multiple CVs simultaneously for recruiter export

### 7. EVALUATION METHODOLOGY
- How to build test dataset: 50 CVs + 10 JDs with ground truth labels
- Metrics: precision@k, recall, NDCG for ranking quality
- Human evaluation: recruiters rate the accuracy of AI explanations

Please write complete, runnable Python code for the CV Parser first, then the scoring function. Include unit tests for each component.