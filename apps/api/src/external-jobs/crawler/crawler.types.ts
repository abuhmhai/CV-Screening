import type { JobSource } from "../dto/query-jobs.dto";

/** Normalized shape every crawler must return before persistence. */
export interface RawJob {
  source: JobSource;
  title: string;
  company: string;
  salary?: string | null;
  location?: string | null;
  /** Canonical link to the original job posting (TopCV / VietnamWorks detail page). */
  url: string;
  jd?: string | null;
  skills: string[];
}

export const BOT_USER_AGENT = "TalentFlowBot/1.0 (+https://talentflow.vn/bot)";

/** Simple async sleep helper used for polite rate limiting. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
