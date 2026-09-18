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

export const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
export const BOT_USER_AGENT = BROWSER_USER_AGENT;

/** Simple async sleep helper used for polite rate limiting. */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
