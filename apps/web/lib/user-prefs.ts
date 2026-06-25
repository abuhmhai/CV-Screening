import { AppearancePrefs, NotificationPrefs } from "./types";

const NOTIFICATION_KEY = "cv_notification_prefs";
const APPEARANCE_KEY = "cv_appearance_prefs";

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  emailApplications: true,
  emailMessages: true,
  emailJobAlerts: true,
  emailDigest: true,
  pushMessages: true,
  pushApplications: true,
  marketingEmails: false
};

export const DEFAULT_APPEARANCE_PREFS: AppearancePrefs = {
  fontSize: "default",
  compactMode: false,
  reduceMotion: false,
  highContrast: false
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadNotificationPrefs(): NotificationPrefs {
  return readJson(NOTIFICATION_KEY, DEFAULT_NOTIFICATION_PREFS);
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  writeJson(NOTIFICATION_KEY, prefs);
}

export function loadAppearancePrefs(): AppearancePrefs {
  return readJson(APPEARANCE_KEY, DEFAULT_APPEARANCE_PREFS);
}

export function saveAppearancePrefs(prefs: AppearancePrefs) {
  writeJson(APPEARANCE_KEY, prefs);
  applyAppearancePrefs(prefs);
}

export function applyAppearancePrefs(prefs: AppearancePrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.fontSize = prefs.fontSize;
  root.dataset.compact = prefs.compactMode ? "true" : "false";
  root.dataset.reduceMotion = prefs.reduceMotion ? "true" : "false";
  root.dataset.highContrast = prefs.highContrast ? "true" : "false";
}
