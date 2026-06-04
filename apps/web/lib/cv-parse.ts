/**
 * Lightweight, dependency-free CV parser used to turn the raw text extracted
 * from an uploaded CV file (cvFile.extractedText) into structured details that
 * can be listed on the AI score page and compared against a job description.
 *
 * The heuristics mirror the backend local screening engine
 * (apps/api/src/ai-screening/local-screening.ts) so what the UI shows is
 * consistent with how the CV is actually scored.
 */

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

const KNOWN_SKILLS: string[] = [
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
];

export interface ParsedCvContact {
  email: string | null;
  phone: string | null;
  links: string[];
}

export interface ParsedCvSection {
  title: string;
  content: string;
}

export interface ParsedCv {
  hasText: boolean;
  contact: ParsedCvContact;
  skills: string[];
  totalYears: number;
  education: string[];
  certifications: string[];
  languages: string[];
  sections: ParsedCvSection[];
}

export interface CvJobComparison {
  matched: string[];
  missing: string[];
  extra: string[];
  matchPct: number;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeSkill(value: string): string {
  const lowered = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.+#\-\s]/g, "");
  return SKILL_ALIASES[lowered] ?? lowered;
}

/** Word-ish boundary match so "go" doesn't match "google". */
function textContainsSkill(text: string, skill: string): boolean {
  const pattern = new RegExp(`(^|[^a-z0-9+#.])${escapeRegex(skill)}([^a-z0-9+#]|$)`, "i");
  return pattern.test(` ${text} `);
}

function extractEmail(text: string): string | null {
  const match = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const compact = text.replace(/[^\d+]/g, " ");
  const match = compact.match(/(?:\+?84|0)\s?\d[\d\s]{7,11}/);
  return match ? match[0].replace(/\s+/g, " ").trim() : null;
}

function extractLinks(text: string): string[] {
  const found = new Set<string>();
  const urlPattern = /(https?:\/\/[^\s)]+)|((?:www\.)?(?:github|gitlab|linkedin|behance|dribbble)\.com\/[^\s)]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(text)) !== null) {
    found.add(match[0].replace(/[.,;]+$/, ""));
  }
  return [...found].slice(0, 6);
}

function extractTotalYears(text: string): number {
  const lowered = text.toLowerCase();
  const matches = lowered.matchAll(/(\d+(?:\.\d+)?)\s*(?:\+\s*)?(?:years|year|năm)/g);
  let max = 0;
  for (const match of matches) {
    const value = parseFloat(match[1]);
    if (!Number.isNaN(value) && value > max) max = value;
  }
  return max;
}

function detectSkills(text: string, extraSkills: string[] = []): string[] {
  const lowered = text.toLowerCase();
  const found = new Set<string>();
  for (const skill of KNOWN_SKILLS) {
    if (textContainsSkill(lowered, skill)) found.add(skill);
  }
  for (const raw of extraSkills) {
    const normalized = normalizeSkill(raw);
    if (normalized && textContainsSkill(lowered, normalized)) found.add(normalized);
  }
  return [...found];
}

const EDUCATION_KEYWORDS = ["university", "đại học", "dai hoc", "college", "institute", "học viện", "hoc vien", "bachelor", "master", "phd", "cử nhân", "thạc sĩ"];
const CERT_KEYWORDS = ["certificate", "certified", "certification", "chứng chỉ", "chung chi"];
const LANGUAGE_MAP: Record<string, string> = {
  english: "Tiếng Anh",
  "tiếng anh": "Tiếng Anh",
  vietnamese: "Tiếng Việt",
  "tiếng việt": "Tiếng Việt",
  japanese: "Tiếng Nhật",
  "tiếng nhật": "Tiếng Nhật",
  chinese: "Tiếng Trung",
  "tiếng trung": "Tiếng Trung",
  korean: "Tiếng Hàn",
  "tiếng hàn": "Tiếng Hàn",
  french: "Tiếng Pháp",
  german: "Tiếng Đức"
};

function extractMatchingLines(text: string, keywords: string[], limit: number): string[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const found: string[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const lowered = line.toLowerCase();
    if (keywords.some((keyword) => lowered.includes(keyword))) {
      const key = lowered.slice(0, 120);
      if (!seen.has(key)) {
        seen.add(key);
        found.push(line.length > 160 ? `${line.slice(0, 157)}...` : line);
      }
    }
    if (found.length >= limit) break;
  }
  return found;
}

function extractLanguages(text: string): string[] {
  const lowered = text.toLowerCase();
  const found = new Set<string>();
  for (const [keyword, label] of Object.entries(LANGUAGE_MAP)) {
    if (lowered.includes(keyword)) found.add(label);
  }
  return [...found];
}

const SECTION_HEADINGS: Array<{ title: string; patterns: RegExp }> = [
  { title: "Tóm tắt", patterns: /^(summary|objective|profile|about|giới thiệu|tóm tắt|mục tiêu)\b/i },
  { title: "Kinh nghiệm", patterns: /^(work experience|experience|employment|kinh nghiệm)\b/i },
  { title: "Học vấn", patterns: /^(education|academic|học vấn|trình độ học vấn)\b/i },
  { title: "Kỹ năng", patterns: /^(skills|technical skills|kỹ năng)\b/i },
  { title: "Dự án", patterns: /^(projects?|dự án)\b/i },
  { title: "Chứng chỉ", patterns: /^(certifications?|chứng chỉ)\b/i }
];

function extractSections(text: string): ParsedCvSection[] {
  const lines = text.split(/\r?\n/);
  const sections: ParsedCvSection[] = [];
  let current: ParsedCvSection | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      if (current) current.content += "\n";
      continue;
    }
    const heading = SECTION_HEADINGS.find((entry) => entry.patterns.test(line) && line.length <= 40);
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading.title, content: "" };
      continue;
    }
    if (current) current.content += `${line}\n`;
  }
  if (current) sections.push(current);

  return sections
    .map((section) => ({ title: section.title, content: section.content.trim() }))
    .filter((section) => section.content.length > 0)
    .slice(0, 6);
}

export function parseCv(rawText: string | null | undefined, jobSkills: string[] = []): ParsedCv {
  const text = (rawText ?? "").trim();
  if (!text) {
    return {
      hasText: false,
      contact: { email: null, phone: null, links: [] },
      skills: [],
      totalYears: 0,
      education: [],
      certifications: [],
      languages: [],
      sections: []
    };
  }

  return {
    hasText: true,
    contact: {
      email: extractEmail(text),
      phone: extractPhone(text),
      links: extractLinks(text)
    },
    skills: detectSkills(text, jobSkills),
    totalYears: extractTotalYears(text),
    education: extractMatchingLines(text, EDUCATION_KEYWORDS, 4),
    certifications: extractMatchingLines(text, CERT_KEYWORDS, 5),
    languages: extractLanguages(text),
    sections: extractSections(text)
  };
}

/**
 * Compares the raw CV text against the job's required skills. A skill is
 * considered matched only if it literally appears in the CV text (alias-aware),
 * so the comparison reflects what was actually read from the file.
 */
export function compareCvWithJob(rawText: string | null | undefined, requiredSkills: string[]): CvJobComparison {
  const text = (rawText ?? "").toLowerCase();
  const required = requiredSkills.map((skill) => skill.trim()).filter(Boolean);
  const matched: string[] = [];
  const missing: string[] = [];

  for (const skill of required) {
    const normalized = normalizeSkill(skill);
    const present = text && (textContainsSkill(text, normalized) || textContainsSkill(text, skill.toLowerCase()));
    if (present) matched.push(skill);
    else missing.push(skill);
  }

  const requiredNormalized = new Set(required.map((skill) => normalizeSkill(skill)));
  const extra = text
    ? detectSkills(text).filter((skill) => !requiredNormalized.has(skill))
    : [];

  const matchPct = required.length ? Math.round((matched.length / required.length) * 100) : 0;

  return { matched, missing, extra, matchPct };
}
