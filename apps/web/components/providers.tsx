"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../lib/auth-context";
import { SavedJobsProvider } from "../lib/saved-jobs-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SavedJobsProvider>{children}</SavedJobsProvider>
    </AuthProvider>
  );
}
