// Helpers for extracting structured data from VietnamWorks pages.
// Search pages embed a classic Next.js `__NEXT_DATA__` JSON blob; job detail
// pages stream data through the App Router RSC payload (`self.__next_f`), where
// fields appear as escaped JSON strings like `"jobDescription":"\u003cp\u003e..."`.

/** Parse the `__NEXT_DATA__` JSON blob from a Next.js (pages router) HTML document. */
export function extractNextData(html: string): unknown | null {
  const match = html.match(/id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/**
 * Pull a JSON string value (`"key":"value"`) out of an RSC payload. The payload
 * is itself a JSON-encoded string embedded in JS, so quotes are double-escaped.
 * Returns the raw (still unicode/HTML-escaped) value, or null.
 */
export function extractRscString(html: string, key: string): string | null {
  const re = new RegExp('\\\\?"' + key + '\\\\?"\\s*:\\s*\\\\?"((?:[^"\\\\]|\\\\.)*?)\\\\?"');
  const match = html.match(re);
  return match ? match[1] : null;
}

/**
 * App Router pages stream content as length-prefixed RSC rows
 * (`\n<hexid>:T<hexlen>,<escaped-html>`). When a field like `jobDescription`
 * is a `$<id>` reference instead of inline HTML, the actual job description /
 * requirements live in these rows. Harvest the rows that contain real
 * paragraph markup (and skip analytics/script rows) and return the combined
 * HTML for downstream `htmlToText`.
 */
export function harvestRscJobHtml(html: string): string {
  const rowRe = /\\n([0-9a-f]+):T[0-9a-f]+,/g;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = rowRe.exec(html))) {
    const start = match.index + match[0].length;
    const rest = html.slice(start);
    const end = rest.search(/\\n[0-9a-f]+:/);
    const content = rest.slice(0, end === -1 ? rest.length : end);

    const hasParagraphs =
      content.includes("u003cp") || content.includes("u003cul") || content.includes("u003cli");
    if (!hasParagraphs) continue;

    const isScript =
      content.includes("_gaq") ||
      content.includes("googletag") ||
      content.includes("function(") ||
      content.includes("window.") ||
      /\bvar\s/.test(content);
    if (isScript) continue;

    blocks.push(content);
  }
  return blocks.join("\n");
}

/** True when an RSC field value is a `$<id>` reference rather than inline content. */
export function isRscReference(value: string | null | undefined): boolean {
  return !value || /^\$[0-9a-fL]*$/.test(value);
}

/** Decode `\\uXXXX` / `\uXXXX` escapes that survive in RSC payloads. */
export function decodeUnicodeEscapes(input: string): string {
  return input.replace(/\\{1,2}u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " "
};

/**
 * Convert an HTML fragment (possibly unicode-escaped) into clean plain text,
 * turning list items / block tags into newlines so bullet structure survives.
 */
export function htmlToText(input: string | null | undefined): string {
  if (!input) return "";
  let text = decodeUnicodeEscapes(input);
  text = text.replace(/\\n/g, "\n").replace(/\\t/g, " ").replace(/\\\//g, "/");
  // Block-level tags become line breaks; list items become bullets.
  text = text.replace(/<\/(p|div|h[1-6]|tr)>/gi, "\n");
  text = text.replace(/<li[^>]*>/gi, "\n• ");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  for (const [entity, char] of Object.entries(HTML_ENTITIES)) {
    text = text.split(entity).join(char);
  }
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

/** Collapse a possibly-HTML title into a single clean line. */
export function sanitizeTitle(raw: string | null | undefined): string {
  const text = htmlToText(raw).replace(/\n+/g, " ").replace(/^[•\s-]+/, "").trim();
  return text;
}

/** A title is junk if it is empty, still contains markup, or is implausibly long. */
export function looksLikeJunkTitle(title: string): boolean {
  if (!title) return true;
  if (title.length > 160) return true;
  if (/[<>]/.test(title)) return true;
  if (/tuyển dụng - tìm việc mới nhất/i.test(title)) return true; // VNW SEO alt text
  if (/^việc làm$/i.test(title)) return true;
  return false;
}

/** Derive a human-readable title from a VietnamWorks `-jv` detail URL slug. */
export function titleFromJvUrl(url: string): string | null {
  try {
    const { pathname } = new URL(url);
    let slug = pathname.replace(/^\/+|\/+$/g, "");
    slug = slug.replace(/-jv$/i, "");
    slug = slug.replace(/-+\d+$/i, ""); // trailing numeric job id
    slug = slug.replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
    if (!slug) return null;
    const words = slug.split("-").filter(Boolean);
    if (words.length === 0) return null;
    return words
      .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(" ");
  } catch {
    return null;
  }
}
