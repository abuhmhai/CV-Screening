export type UserRole = "candidate" | "recruiter" | "company_admin" | "system_admin";

export interface ScreeningBreakdown {
  skill_score: number;
  experience_score: number;
  education_score: number;
  other_score: number;
}

export interface ScreeningResult {
  overall_score: number;
  grade: string;
  recommendation: string;
  breakdown: ScreeningBreakdown;
  matched_skills: string[];
  missing_skills: string[];
  processing_time_ms: number;
  cached_key: string;
}
