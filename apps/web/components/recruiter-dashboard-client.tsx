"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { StatCard } from "./stat-card";

interface DashboardApplication {
  id: string;
  status: string;
  candidate?: { profile?: { fullName?: string | null } | null } | null;
  aiResult?: { overallScore: string; grade: string } | null;
}

interface RecruiterDashboardClientProps {
  candidates: DashboardApplication[];
}

const funnelStages = [
  { label: "Applied", value: 20 },
  { label: "AI Screening", value: 15 },
  { label: "HR Review", value: 12 },
  { label: "Interview", value: 5 },
  { label: "Offer", value: 2 }
];

export function RecruiterDashboardClient({ candidates }: RecruiterDashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const statuses = useMemo(() => ["ALL", ...Array.from(new Set(candidates.map((item) => item.status)))], [candidates]);

  const shortlist = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return [...candidates]
      .filter((item) => {
        const candidateName = item.candidate?.profile?.fullName?.toLowerCase() ?? "candidate";
        const matchesSearch = !keyword || candidateName.includes(keyword);
        const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((left, right) => {
        const leftScore = Number(left.aiResult?.overallScore ?? 0);
        const rightScore = Number(right.aiResult?.overallScore ?? 0);
        return sortDirection === "desc" ? rightScore - leftScore : leftScore - rightScore;
      });
  }, [candidates, searchTerm, sortDirection, statusFilter]);

  const maxScore = useMemo(
    () => Math.max(100, ...shortlist.map((item) => Number(item.aiResult?.overallScore ?? 0))),
    [shortlist]
  );

  return (
    <>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="New applications" value="20" />
        <StatCard label="Passed AI screening" value="12" tone="positive" />
        <StatCard label="Interview stage" value="5" />
        <StatCard label="Offers sent" value="2" tone="warning" />
      </div>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <article className="rounded-xl bg-canvas p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">AI Ranking Shortlist</h2>
            <p className="rounded-pill bg-primary-pale px-3 py-1 text-xs font-semibold text-ink-deep">
              {shortlist.length} candidates
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1.5fr_1fr_1fr]">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search candidate name"
              className="rounded-xl border border-ink/20 px-4 py-2 text-sm text-ink outline-none transition focus:border-ink"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-ink/20 bg-canvas px-4 py-2 text-sm text-ink outline-none transition focus:border-ink"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All statuses" : status}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSortDirection((previous) => (previous === "desc" ? "asc" : "desc"))}
              className="rounded-xl border border-ink px-4 py-2 text-sm font-semibold text-ink transition hover:bg-canvas-soft"
            >
              Sort score: {sortDirection === "desc" ? "High to low" : "Low to high"}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-body">
                  <th className="px-3 py-2">Candidate</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">AI Score</th>
                  <th className="px-3 py-2">Grade</th>
                  <th className="px-3 py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {shortlist.map((item) => (
                  <tr key={item.id} className="border-b border-ink/5 transition hover:bg-canvas-soft/60">
                    <td className="px-3 py-3">{item.candidate?.profile?.fullName ?? "Candidate"}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-pill bg-canvas-soft px-2 py-1 text-xs font-semibold text-ink">{item.status}</span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink">{item.aiResult?.overallScore ?? "-"}</td>
                    <td className="px-3 py-3">{item.aiResult?.grade ?? "-"}</td>
                    <td className="px-3 py-3">
                      <Link
                        href="/ai-score-detail"
                        className="rounded-pill bg-primary px-3 py-1 text-xs font-semibold text-ink transition hover:bg-primary-active"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="space-y-4">
          <article className="rounded-xl bg-canvas p-6">
            <h3 className="text-base font-semibold text-ink">Score Snapshot</h3>
            <div className="mt-4 space-y-2">
              {shortlist.slice(0, 6).map((item) => {
                const score = Number(item.aiResult?.overallScore ?? 0);
                const width = `${Math.max((score / maxScore) * 100, 6)}%`;
                const name = item.candidate?.profile?.fullName ?? "Candidate";

                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between text-xs text-body">
                      <span className="line-clamp-1">{name}</span>
                      <strong className="text-ink">{score.toFixed(1)}</strong>
                    </div>
                    <div className="mt-1 h-2 rounded-pill bg-canvas-soft">
                      <div className="h-full rounded-pill bg-primary transition-all" style={{ width }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <article className="rounded-xl bg-canvas p-6">
            <h3 className="text-base font-semibold text-ink">Pipeline Funnel</h3>
            <div className="mt-4 space-y-2 text-sm">
              {funnelStages.map((stage) => (
                <div key={stage.label} className="rounded-lg bg-canvas-soft px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-body">{stage.label}</span>
                    <strong className="text-ink">{stage.value}</strong>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl bg-canvas p-6">
            <h3 className="text-base font-semibold text-ink">Recruiter Actions</h3>
            <div className="mt-4 space-y-2">
              <button className="w-full rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-ink transition hover:bg-primary-active">
                Create Job Post
              </button>
              <button className="w-full rounded-xl border border-ink px-4 py-2 text-sm font-semibold text-ink transition hover:bg-canvas-soft">
                Export Candidates
              </button>
            </div>
          </article>
        </aside>
      </section>
    </>
  );
}
