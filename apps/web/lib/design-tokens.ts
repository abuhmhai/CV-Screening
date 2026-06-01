/**
 * TalentFlow design tokens — aligned with DESIGN.md (Wise-inspired system).
 * Use CSS variables in styles; use this file for programmatic access / documentation.
 */

export const colors = {
  primary: "#9fe870",
  primaryActive: "#cdffad",
  primaryNeutral: "#c5edab",
  primaryPale: "#e2f6d5",
  canvas: "#ffffff",
  canvasSoft: "#e8ebe6",
  ink: "#0e0f0c",
  inkDeep: "#163300",
  body: "#454745",
  mute: "#868685",
  positive: "#2ead4b",
  positiveDeep: "#054d28",
  warning: "#ffd11a",
  warningDeep: "#b86700",
  warningContent: "#4a3b1c",
  negative: "#d03238",
  negativeDeep: "#a72027",
  negativeDarkest: "#a7000d",
  negativeBg: "#320707",
  accentOrange: "#ffc091",
  accentCyan: "#38c8ff",
  onPrimary: "#0e0f0c"
} as const;

export const radius = {
  none: "0px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  pill: "9999px",
  full: "9999px"
} as const;

export const spacing = {
  xxs: "2px",
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px"
} as const;

export const typography = {
  displayMega: { size: "126px", weight: 900, lineHeight: "107.1px" },
  displayXxl: { size: "96px", weight: 900, lineHeight: "81.6px" },
  displayXl: { size: "64px", weight: 900, lineHeight: "54.4px" },
  displayMd: { size: "40px", weight: 900, lineHeight: "34px" },
  displaySm: { size: "32px", weight: 600, lineHeight: "38.4px", letterSpacing: "-0.96px" },
  displayXs: { size: "24px", weight: 600, lineHeight: "31.2px", letterSpacing: "-0.48px" },
  bodyLg: { size: "20px", weight: 400, lineHeight: "30px" },
  bodyMd: { size: "16px", weight: 400, lineHeight: "24px" },
  bodyMdStrong: { size: "16px", weight: 600, lineHeight: "24px" },
  bodySm: { size: "14px", weight: 400, lineHeight: "20px" },
  bodySmStrong: { size: "14px", weight: 600, lineHeight: "20px" },
  caption: { size: "12px", weight: 400, lineHeight: "16px" },
  buttonMd: { size: "16px", weight: 600, lineHeight: "24px" }
} as const;

/** Application status → semantic badge mapping (not brand CTA green) */
export const statusBadge = {
  active: { bg: "var(--colors-primary-pale)", text: "var(--colors-positive-deep)" },
  screening: { bg: "var(--colors-warning)", text: "var(--colors-warning-content)" },
  review: { bg: "var(--colors-canvas-soft)", text: "var(--colors-ink)" },
  interview: { bg: "var(--colors-primary-neutral)", text: "var(--colors-ink-deep)" },
  rejected: { bg: "var(--colors-negative-bg)", text: "#ffffff" },
  pending: { bg: "var(--colors-warning)", text: "var(--colors-warning-content)" },
  accepted: { bg: "var(--colors-primary-pale)", text: "var(--colors-positive-deep)" },
  default: { bg: "var(--colors-canvas-soft)", text: "var(--colors-body)" }
} as const;
