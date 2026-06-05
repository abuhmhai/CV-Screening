"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, ExternalLink, ListChecks, MapPin, Sparkles, Wallet, X } from "lucide-react";
import { apiFetch } from "../../lib/api-client";
import { ExternalJob, ExternalJobSummary } from "../../lib/types";
import { Button } from "../ui/button";
import { SkillTag } from "../ui/skill-tag";
import { sourceMeta } from "./source-meta";

export function JobSummaryPanel({ job, onClose }: { job: ExternalJob | null; onClose: () => void }) {
  const [summary, setSummary] = useState<ExternalJobSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!job) {
      setSummary(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSummary(null);
    apiFetch<ExternalJobSummary>(`/external-jobs/${job.id}/summary`).then((res) => {
      if (cancelled) return;
      if (res.ok && res.data) setSummary(res.data);
      else setError(res.error ?? "Không tải được tóm tắt việc làm.");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [job]);

  const source = job ? sourceMeta(job.source) : null;

  return (
    <AnimatePresence>
      {job ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-y-auto bg-canvas shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-ink/10 p-5">
              <div>
                {source ? (
                  <span className={`rounded-pill border px-2.5 py-0.5 text-[11px] font-bold ${source.badgeClass}`}>
                    {source.label}
                  </span>
                ) : null}
                <h2 className="mt-2 text-lg font-bold text-ink">{summary?.title ?? job.title}</h2>
                <div className="mt-1 space-y-1 text-body-sm text-body">
                  <p className="flex items-center gap-2"><Building2 size={14} className="text-mute" /> {summary?.company ?? job.company}</p>
                  {(summary?.location ?? job.location) ? (
                    <p className="flex items-center gap-2"><MapPin size={14} className="text-mute" /> {summary?.location ?? job.location}</p>
                  ) : null}
                  <p className="flex items-center gap-2"><Wallet size={14} className="text-mute" /> {summary?.salary ?? job.salary ?? "Thương lượng"}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} className="rounded-full p-2 text-body hover:bg-canvas-soft" aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-5 p-5">
              {loading ? (
                <div className="space-y-3">
                  <div className="skeleton h-5 w-1/3" />
                  <div className="skeleton h-24 w-full" />
                  <div className="skeleton h-24 w-full" />
                </div>
              ) : error ? (
                <p className="rounded-lg border border-hairline-strong bg-accent-red-glow p-3 text-sm text-negative">{error}</p>
              ) : summary ? (
                <>
                  {summary.highlights.length ? (
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                        <Sparkles size={16} className="text-accent-blue" /> Tóm tắt nhanh
                      </p>
                      <ul className="space-y-1.5 text-sm text-ink">
                        {summary.highlights.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-blue" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {summary.skills.length ? (
                    <div>
                      <p className="mb-2 text-body-sm font-semibold text-ink">Kỹ năng / từ khóa</p>
                      <div className="flex flex-wrap gap-1.5">
                        {summary.skills.map((skill) => (
                          <SkillTag key={skill}>{skill}</SkillTag>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {summary.description ? (
                    <div>
                      <p className="mb-2 text-body-sm font-semibold text-ink">Mô tả công việc</p>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-body">{summary.description}</p>
                    </div>
                  ) : null}

                  {summary.requirements ? (
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-body-sm font-semibold text-ink">
                        <ListChecks size={15} className="text-mute" /> Yêu cầu ứng viên
                      </p>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-body">{summary.requirements}</p>
                    </div>
                  ) : null}

                  {!summary.hasDetail ? (
                    <p className="rounded-lg border border-ink/10 bg-canvas-soft p-3 text-sm text-body">
                      Chưa lấy được mô tả chi tiết cho tin này. Bấm &quot;Xem tin gốc&quot; để đọc đầy đủ trên {source?.label}.
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>

            <div className="border-t border-ink/10 p-5">
              <a href={summary?.url ?? job.url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" className="w-full" leftIcon={<ExternalLink size={16} />}>
                  Xem tin gốc trên {source?.label}
                </Button>
              </a>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
