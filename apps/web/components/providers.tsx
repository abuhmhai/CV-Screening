"use client";

import { ReactNode, useEffect } from "react";
import { AuthProvider } from "../lib/auth-context";
import { SavedJobsProvider } from "../lib/saved-jobs-context";
import { applyAppearancePrefs, loadAppearancePrefs } from "../lib/user-prefs";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyAppearancePrefs(loadAppearancePrefs());
  }, []);

  return (
    <AuthProvider>
      <SavedJobsProvider>{children}</SavedJobsProvider>
    </AuthProvider>
  );
}
