import type { AiScreeningResult } from "./ai-screening.service";

/**
 * Native TypeScript implementation of the AI Screening pipeline described in
 * `AI Screening.md`. It mirrors the Python FastAPI scorer (CV parse -> JD parse ->
 * skill / experience / education / other matching -> weighted aggregation) so the
 * platform can produce real screening results even when the Python service is
 * offline (e.g. local dev without Python).
 *
 * Weights follow the spec: skills 40% + experience 30% + education 20% + other 10%.
 */

export interface ScreeningContext {
  candidateSkills?: Array<{ name: string; years?: number | null }>;
  candidateTotalYears?: number;
  requiredSkills?: string[];
  minExperienceYears?: number;
  education?: Array<{ degree?: string | null; gpa?: number | null }>;
  hasCertifications?: boolean;
  hasPortfolio?: boolean;
  jobLevel?: string | null;
}

const SKILL_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  reactjs: "react",
  "react.js": "react",
  nodejs: "node.js",
  node: "node.js",
  nextjs: "next.js",
  postgres: "postgresql",
  psql: "postgresql",
  ml: "machine learning",
  k8s: "kubernetes",
  "c sharp": "c#",
  golang: "go"
};

const KNOWN_SKILLS = new Set<string>([
  "python",
  "fastapi",
  "nestjs",
  "node.js",
  "react",
  "next.js",
  "vue",
  "angular",
  "postgresql",
  "mysql",
  "mongodb",
  "redis",
  "docker",
  "kubernetes",
  "java",
  "spring",
  "typescript",
  "javascript",
  "go",
  "rust",
  "c#",
  "c++",
  "php",
  "laravel",
  "django",
  "flask",
  "graphql",
  "rest",
  "aws",
  "gcp",
  "azure",
  "terraform",
  "machine learning",
  "deep learning",
  "nlp",
  "spacy",
  "pytorch",
  "tensorflow",
  "sentence-transformers",
  "sql",
  "tailwind",
  "html",
  "css"
]);

const DEGREE_PRIORITY: Record<string, number> = {
  highschool: 0,
  associate: 1,
  bachelor: 2,
  master: 3,
  phd: 4,
  doctorate: 4
};

export function normalizeSkill(value: string): string {
  const lowered = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.+#\-\s]/g, "");
  return SKILL_ALIASES[lowered] ?? lowered;
}

function normalizeDegree(value?: string | null): string {
  if (!value) return "bachelor";
  const lowered = value.toLowerCase();
  if (lowered.includes("phd") || lowered.includes("doctor") || lowered.includes("tiến sĩ")) return "phd";
  if (lowered.includes("master") || lowered.includes("thạc")) return "master";
  if (lowered.includes("associate") || lowered.includes("cao đẳng")) return "associate";
  if (lowered.includes("high") || lowered.includes("thpt")) return "highschool";
  return "bachelor";
}

function extractYears(text: string): number {
  const matches = text.toLowerCase().matchAll(/(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:years|year|năm)/g);
  let max = 0;
  for (const match of matches) {
    const value = parseFloat(match[1]);
    if (!Number.isNaN(value) && value > max) max = value;
  }
  return max;
}

function detectSkillsFromText(text: string): string[] {
  const lowered = ` ${text.toLowerCase()} `;
  const found = new Set<string>();
  for (const skill of KNOWN_SKILLS) {
    // word-ish boundary match to avoid "go" matching "google"
    const pattern = new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(skill)}([^a-z0-9+#]|$)`, "i");
    if (pattern.test(lowered)) {
      found.add(skill);
    }
  }
  return [...found];
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface CvData {
  skills: Array<{ skill: string; years: number }>;
  totalYears: number;
  education: Array<{ degree: string; gpa: number | null }>;
  hasCertifications: boolean;
  hasPortfolio: boolean;
}

interface JdData {
  requiredSkills: string[];
  minExperienceYears: number;
}

function buildCvData(cvText: string, context?: ScreeningContext): CvData {
  const skillMap = new Map<string, number>();

  for (const detected of detectSkillsFromText(cvText)) {
    skillMap.set(normalizeSkill(detected), extractYears(cvText) || 1);
  }

  for (const item of context?.candidateSkills ?? []) {
    const normalized = normalizeSkill(item.name);
    if (!normalized) continue;
    const years = item.years != null && item.years > 0 ? item.years : skillMap.get(normalized) ?? 1;
    skillMap.set(normalized, years);
  }

  const skills = [...skillMap.entries()].map(([skill, years]) => ({ skill, years }));

  const contextYears = (context?.candidateSkills ?? [])
    .map((item) => (item.years != null ? item.years : 0))
    .filter((value) => value > 0);
  const totalYears = Math.max(
    extractYears(cvText),
    context?.candidateTotalYears ?? 0,
    ...(contextYears.length ? contextYears : [0])
  );

  const education = (context?.education ?? []).map((row) => ({
    degree: normalizeDegree(row.degree),
    gpa: row.gpa != null ? Number(row.gpa) : null
  }));

  const loweredCv = cvText.toLowerCase();
  return {
    skills,
    totalYears,
    education,
    hasCertifications: Boolean(context?.hasCertifications) || /certificat|chứng chỉ/.test(loweredCv),
    hasPortfolio:
      Boolean(context?.hasPortfolio) || /github|portfolio|gitlab|behance|dribbble/.test(loweredCv)
  };
}

function buildJdData(jdText: string, context?: ScreeningContext): JdData {
  const required = new Set<string>();
  for (const skill of context?.requiredSkills ?? []) {
    const normalized = normalizeSkill(skill);
    if (normalized) required.add(normalized);
  }
  if (required.size === 0) {
    for (const detected of detectSkillsFromText(jdText)) {
      required.add(normalizeSkill(detected));
    }
  }

  let minExperienceYears = context?.minExperienceYears ?? 0;
  if (!minExperienceYears) {
    const match = jdText
      .toLowerCase()
      .match(/(\d+)\s*(?:\+\s*)?(?:years|năm)[^.]{0,20}(?:experience|kinh nghiệm)/);
    minExperienceYears = match ? parseInt(match[1], 10) : 1;
  }

  return {
    requiredSkills: [...required],
    minExperienceYears
  };
}

function gradeFor(score: number): { grade: string; recommendation: string } {
  if (score >= 90) return { grade: "A+", recommendation: "Strongly recommend for interview" };
  if (score >= 85) return { grade: "A", recommendation: "Strongly recommend for interview" };
  if (score >= 75) return { grade: "B+", recommendation: "Recommend for interview" };
  if (score >= 65) return { grade: "B", recommendation: "Consider for interview" };
  if (score >= 50) return { grade: "C", recommendation: "Need manual recruiter review" };
  return { grade: "D", recommendation: "Not recommended" };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function runLocalScreening(
  cvText: string,
  jdText: string,
  context?: ScreeningContext
): AiScreeningResult {
  const start = Date.now();
  const cv = buildCvData(cvText, context);
  const jd = buildJdData(jdText, context);

  const cvSkillSet = new Set(cv.skills.map((item) => item.skill));
  const matchedSkills = jd.requiredSkills.filter((skill) => cvSkillSet.has(skill));
  const missingSkills = jd.requiredSkills.filter((skill) => !cvSkillSet.has(skill));

  const skillRatio = jd.requiredSkills.length ? matchedSkills.length / jd.requiredSkills.length : 1;
  const skillScore = round2(skillRatio * 100);

  let experienceScore: number;
  if (jd.minExperienceYears <= 0) {
    experienceScore = 100;
  } else {
    const ratio = Math.min(cv.totalYears / jd.minExperienceYears, 1.3);
    experienceScore = round2(Math.min(ratio * 100, 100));
  }

  let educationScore = 60;
  if (cv.education.length) {
    const best = cv.education.reduce((acc, row) =>
      DEGREE_PRIORITY[row.degree] >= DEGREE_PRIORITY[acc.degree] ? row : acc
    );
    educationScore = DEGREE_PRIORITY[best.degree] >= DEGREE_PRIORITY.bachelor ? 80 : 65;
    if (best.gpa != null && best.gpa >= 3.2) {
      educationScore = Math.min(educationScore + 10, 100);
    }
  }

  let otherScore = 60;
  if (cv.hasCertifications) otherScore += 15;
  if (cv.hasPortfolio) otherScore += 15;
  otherScore = Math.min(otherScore, 100);

  const overallScore = round2(
    skillScore * 0.4 + experienceScore * 0.3 + educationScore * 0.2 + otherScore * 0.1
  );
  const { grade, recommendation } = gradeFor(overallScore);

  const strengths: string[] = [];
  if (skillScore >= 75) strengths.push("Strong alignment with required technical skills");
  if (experienceScore >= 75) strengths.push("Relevant years of experience for the role");
  if (educationScore >= 80) strengths.push("Education profile meets job expectations");
  if (cv.hasPortfolio) strengths.push("Public portfolio / open-source presence");
  if (strengths.length === 0) strengths.push("Baseline profile suitable for further review");

  const concerns: string[] = [];
  if (missingSkills.length) {
    concerns.push(`Missing skills: ${missingSkills.slice(0, 6).join(", ")}`);
  }
  if (experienceScore < 60) concerns.push("Experience depth may be below requirement");
  if (educationScore < 65) concerns.push("Education signal is limited");
  if (concerns.length === 0) concerns.push("No major risk identified in automated screening");

  const skillGaps = missingSkills.map((skill) => ({ skill, importance: "mandatory" }));

  return {
    overall_score: overallScore,
    grade,
    recommendation,
    breakdown: {
      skill_score: skillScore,
      experience_score: experienceScore,
      education_score: educationScore,
      other_score: otherScore
    },
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    skill_gaps: skillGaps,
    experience_analysis: {
      required_years: jd.minExperienceYears,
      actual_years: round2(cv.totalYears),
      relevant_experience: matchedSkills.length
        ? `Hands-on experience with ${matchedSkills.slice(0, 4).join(", ")}`
        : "Relevant experience could not be confirmed from the CV"
    },
    strengths,
    concerns,
    explanation:
      "Weighted matching - skills 40%, experience 30%, education 20%, other 10%. " +
      `Matched ${matchedSkills.length}/${jd.requiredSkills.length} required skills.`,
    model_version: "cv-screener-ts-v1.0.0",
    processing_time_ms: Math.max(1, Date.now() - start),
    cached_key: ""
  };
}
