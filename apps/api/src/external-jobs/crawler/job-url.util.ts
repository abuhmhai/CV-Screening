import type { JobSource } from "../dto/query-jobs.dto";

const TOPCV_HOSTS = new Set(["www.topcv.vn", "topcv.vn"]);
const VNW_HOSTS = new Set(["www.vietnamworks.com", "vietnamworks.com"]);

/** Absolute TopCV job detail URL (not search/listing pages). */
export function normalizeTopCvJobUrl(href?: string | null): string | null {
  if (!href?.trim()) return null;

  try {
    const absolute = href.startsWith("http")
      ? href.trim()
      : `https://www.topcv.vn${href.startsWith("/") ? href : `/${href}`}`;
    const url = new URL(absolute);

    if (!TOPCV_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.includes("/viec-lam/")) return null;
    if (url.pathname.includes("/tim-viec-lam")) return null;
    if (/\/seed-\d+\.html$/i.test(url.pathname)) return null;

    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

/** Absolute VietnamWorks job detail URL (slug ending in -jv). */
export function normalizeVietnamWorksJobUrl(href?: string | null): string | null {
  if (!href?.trim()) return null;

  try {
    const trimmed = href.trim();
    const absolute = trimmed.startsWith("http")
      ? trimmed
      : `https://www.vietnamworks.com/${trimmed.replace(/^\/+/, "")}`;
    const url = new URL(absolute);

    if (!VNW_HOSTS.has(url.hostname)) return null;
    if (/seed-\d+/i.test(url.pathname)) return null;

    const path = url.pathname.replace(/\/+$/, "");
    if (!path || path === "/jobs" || path === "/viec-lam") return null;

    // Real job detail slugs carry a numeric job id before `-jv`
    // (e.g. `rpa-developer--2056771-jv`). Generic listing links such as
    // `tim-viec-lam-jv` have no id and must be rejected.
    const hasJobId = (slug: string) => /\d/.test(slug.replace(/-jv$/i, ""));

    if (path.endsWith("-jv")) {
      return hasJobId(path) ? `${url.origin}${path}` : null;
    }

    const segment = path.startsWith("/") ? path.slice(1) : path;
    if (segment && !segment.includes("/")) {
      const withSuffix = segment.endsWith("-jv") ? segment : `${segment}-jv`;
      return hasJobId(withSuffix) ? `${url.origin}/${withSuffix}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function buildVietnamWorksJobUrl(fields: {
  jobUrl?: string | null;
  redirectUrl?: string | null;
  alias?: string | null;
  jobId?: number | string | null;
  objectID?: string | number | null;
  jobTitle?: string | null;
}): string | null {
  for (const candidate of [fields.jobUrl, fields.redirectUrl]) {
    const normalized = normalizeVietnamWorksJobUrl(candidate);
    if (normalized) return normalized;
  }

  const alias = fields.alias?.trim();
  if (alias) {
    const normalized = normalizeVietnamWorksJobUrl(alias);
    if (normalized) return normalized;
  }

  const rawId = fields.jobId ?? fields.objectID;
  if (rawId == null || rawId === "") return null;

  const id = String(rawId).trim();

  if (fields.jobTitle?.trim()) {
    const slug = slugifyJobTitle(fields.jobTitle);
    if (slug) {
      return normalizeVietnamWorksJobUrl(`https://www.vietnamworks.com/${slug}-${id}-jv`);
    }
  }

  return normalizeVietnamWorksJobUrl(`https://www.vietnamworks.com/viec-lam-${id}-jv`);
}

const ITVIEC_HOSTS = new Set(["www.itviec.com", "itviec.com"]);
const CAREERVIET_HOSTS = new Set(["www.careerviet.vn", "careerviet.vn", "www.careerbuilder.vn", "careerbuilder.vn"]);

export function normalizeItViecJobUrl(href?: string | null): string | null {
  if (!href?.trim()) return null;
  try {
    const trimmed = href.trim();
    const absolute = trimmed.startsWith("http")
      ? trimmed
      : `https://itviec.com${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
    const url = new URL(absolute);
    if (!ITVIEC_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.includes("/it-jobs/")) return null;
    // Strip query parameters
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function normalizeCareerVietJobUrl(href?: string | null): string | null {
  if (!href?.trim()) return null;
  try {
    const trimmed = href.trim();
    const absolute = trimmed.startsWith("http")
      ? trimmed
      : `https://careerviet.vn${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
    const url = new URL(absolute);
    if (!CAREERVIET_HOSTS.has(url.hostname)) return null;
    if (!url.pathname.endsWith(".html")) return null;
    return `${url.origin}${url.pathname}`;
  } catch {
    return null;
  }
}

export function normalizeJobUrl(url: string, source: JobSource): string | null {
  if (source === "topcv") return normalizeTopCvJobUrl(url);
  if (source === "vietnamworks") return normalizeVietnamWorksJobUrl(url);
  if (source === "itviec") return normalizeItViecJobUrl(url);
  if (source === "careerviet") return normalizeCareerVietJobUrl(url);
  return null;
}

export function isPersistableJobDetailUrl(url: string, source: JobSource): boolean {
  return normalizeJobUrl(url, source) != null;
}

/** Search/listing URLs used only when live crawl returns nothing (seed fallback). */
export function normalizeSeedBrowseUrl(url: string, source: JobSource): string | null {
  if (!url?.trim()) return null;

  try {
    const absolute = url.startsWith("http") ? url.trim() : `https://www.${source === "topcv" ? "topcv.vn" : "vietnamworks.com"}${url.startsWith("/") ? url : `/${url}`}`;
    const parsed = new URL(absolute);

    if (source === "topcv" && TOPCV_HOSTS.has(parsed.hostname) && parsed.pathname.includes("/tim-viec-lam")) {
      return parsed.href;
    }

    if (
      source === "vietnamworks" &&
      VNW_HOSTS.has(parsed.hostname) &&
      (parsed.pathname === "/viec-lam" || parsed.pathname === "/jobs") &&
      parsed.searchParams.has("q")
    ) {
      return parsed.href;
    }

    return null;
  } catch {
    return null;
  }
}

export function resolveJobUrlForSave(
  url: string,
  source: JobSource,
  allowBrowseUrls: boolean
): string | null {
  return normalizeJobUrl(url, source) ?? (allowBrowseUrls ? normalizeSeedBrowseUrl(url, source) : null);
}

function slugifyJobTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
