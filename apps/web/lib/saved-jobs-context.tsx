"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { apiFetch } from "./api-client";
import { useAuth } from "./auth-context";

interface SavedJobsContextValue {
  savedIds: Set<string>;
  isSaved: (jobId: string) => boolean;
  toggleSave: (jobId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const SavedJobsContext = createContext<SavedJobsContextValue | null>(null);

export function SavedJobsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!token) {
      setSavedIds(new Set());
      return;
    }
    const res = await apiFetch<string[]>("/users/me/saved-jobs/ids", { token });
    if (res.ok && res.data) {
      setSavedIds(new Set(res.data));
    }
  }, [token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleSave = useCallback(
    async (jobId: string) => {
      if (!token) return;
      const currentlySaved = savedIds.has(jobId);
      // Optimistic update
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (currentlySaved) next.delete(jobId);
        else next.add(jobId);
        return next;
      });
      const res = await apiFetch(`/jobs/${jobId}/save`, {
        method: currentlySaved ? "DELETE" : "POST",
        token
      });
      if (!res.ok) {
        // Revert on failure
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (currentlySaved) next.add(jobId);
          else next.delete(jobId);
          return next;
        });
      }
    },
    [savedIds, token]
  );

  const value = useMemo(
    () => ({
      savedIds,
      isSaved: (jobId: string) => savedIds.has(jobId),
      toggleSave,
      refresh
    }),
    [savedIds, toggleSave, refresh]
  );

  return <SavedJobsContext.Provider value={value}>{children}</SavedJobsContext.Provider>;
}

export function useSavedJobs(): SavedJobsContextValue {
  const ctx = useContext(SavedJobsContext);
  if (!ctx) {
    throw new Error("useSavedJobs must be used within SavedJobsProvider");
  }
  return ctx;
}
