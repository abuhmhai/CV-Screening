"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { loadAppearancePrefs, toggleTheme, getResolvedTheme } from "../../lib/user-prefs";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    setMounted(true);
    const prefs = loadAppearancePrefs();
    setCurrentTheme(getResolvedTheme(prefs.theme));

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cv_appearance_prefs") {
        const updated = loadAppearancePrefs();
        setCurrentTheme(getResolvedTheme(updated.theme));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setCurrentTheme(next);
  };

  if (!mounted) {
    return (
      <div
        className={`inline-flex items-center justify-center h-9 w-9 rounded-md border border-hairline bg-surface-card text-mute opacity-70 ${className}`}
        aria-hidden="true"
      >
        <Moon className="h-4 w-4" />
      </div>
    );
  }

  const isLight = currentTheme === "light";

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`relative inline-flex items-center justify-center gap-2 h-9 px-2.5 rounded-md border border-hairline bg-surface-card text-ink hover:bg-surface-elevated hover:border-hairline-strong transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${className}`}
      title={isLight ? "Chuyển sang Giao diện Tối (Dark)" : "Chuyển sang Giao diện Sáng (Light)"}
      aria-label={isLight ? "Chuyển sang Giao diện Tối" : "Chuyển sang Giao diện Sáng"}
    >
      {isLight ? (
        <Moon className="h-4 w-4 text-accent-blue transition-transform duration-200 hover:rotate-12" />
      ) : (
        <Sun className="h-4 w-4 text-accent-yellow transition-transform duration-200 hover:rotate-45" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isLight ? "Giao diện Tối" : "Giao diện Sáng"}
        </span>
      )}
    </button>
  );
}