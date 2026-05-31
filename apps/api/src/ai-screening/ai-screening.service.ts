import { Injectable, Logger } from "@nestjs/common";

export interface AiScreeningBreakdown {
  skill_score: number;
  experience_score: number;
  education_score: number;
  other_score: number;
}

export interface AiScreeningResult {
  overall_score: number;
  grade: string;
  recommendation: string;
  breakdown: AiScreeningBreakdown;
  matched_skills: string[];
  missing_skills: string[];
  skill_gaps: Array<{ skill: string; importance: string }>;
  experience_analysis: {
    required_years: number;
    actual_years: number;
    relevant_experience: string;
  };
  strengths: string[];
  concerns: string[];
  explanation: string;
  model_version: string;
  processing_time_ms: number;
  cached_key: string;
}

@Injectable()
export class AiScreeningService {
  private readonly logger = new Logger(AiScreeningService.name);
  private readonly aiServiceUrl: string;
  private readonly timeoutMs: number;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL ?? "http://localhost:8000";
    this.timeoutMs = 10_000;
  }

  async screen(cvContent: string, jdText: string, jobId?: string): Promise<AiScreeningResult | null> {
    const url = `${this.aiServiceUrl}/screen`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cv_data: { raw_text: cvContent },
          jd_text: jdText,
          job_id: jobId ?? null,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(`AI service responded ${response.status}`);
        return null;
      }

      return (await response.json()) as AiScreeningResult;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`AI screening call failed: ${message}`);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }
}
