"use client";

import { useMemo } from "react";
import { Bookmark, Building2, Check, Clock, MapPin, Sparkles, Wallet } from "lucide-react";
import { ExternalJob } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { SkillTag } from "../ui/skill-tag";
import { sourceMeta } from "./source-meta";

export function ExternalJobCard({
  job,
  onScreen,
  onSummarize,
  userSkills = [],
  isSaved = false,
  onToggleSave
}: {
  job: ExternalJob;
  onScreen: (job: ExternalJob) => void;
  onSummarize: (job: ExternalJob) => void;
  userSkills?: string[];
  isSaved?: boolean;
  onToggleSave?: (jobId: string) => void;
}) {
  const source = sourceMeta(job.source);

  const normalizedUserSkills = useMemo(
    () => new Set(userSkills.map((s) => s.trim().toLowerCase())),
    [userSkills]
  );

  const { matchingSkills, totalSkills, matchPercent } = useMemo(() => {
    const skills = job.skills ?? [];
    if (skills.length === 0 || normalizedUserSkills.size === 0) {
      return { matchingSkills: new Set<string>(), totalSkills: skills.length, matchPercent: null };
    }
    const matching = new Set<string>();
    for (const s of skills) {
      const sLower = s.trim().toLowerCase();
      if (normalizedUserSkills.has(sLower)) {
        matching.add(s);
      } else {
        for (const u of normalizedUserSkills) {
          if (u.includes(sLower) || sLower.includes(u)) {
            matching.add(s);
            break;
          }
        }
      }
    }
    const pct = Math.round((matching.size / skills.length) * 100);
    return { matchingSkills: matching, totalSkills: skills.length, matchPercent: pct };
  }, [job.skills, normalizedUserSkills]);

  return (
    <Card className="flex h-full flex-col gap-3 transition-all hover:border-hairline hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`shrink-0 rounded-pill border px-2.5 py-0.5 text-[11px] font-bold ${source.badgeClass}`}>
              {source.label}
            </span>
            {matchPercent !== null ? (
              <span
                className={`inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-[11px] font-semibold transition-all ${
                  matchPercent >= 70
                    ? "border-positive/30 bg-accent-green-glow text-positive-deep"
                    : matchPercent >= 40
                    ? "border-warning/30 bg-accent-yellow-glow text-warning"
                    : "border-hairline-strong bg-surface-elevated text-mute"
                }`}
                title={`Khớp ${matchingSkills.size}/${totalSkills} kỹ năng trong hồ sơ của bạn`}
              >
                <Sparkles size={12} className={matchPercent >= 50 ? "text-positive" : "text-mute"} />
                Khớp {matchPercent}% ({matchingSkills.size}/{totalSkills})
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => onSummarize(job)}
            className="mt-2 text-left text-base font-bold text-ink line-clamp-2 transition hover:text-accent-blue hover:underline focus:outline-none focus-visible:underline"
            title="Xem tóm tắt việc làm"
          >
            {job.title}
          </button>
        </div>

        {onToggleSave ? (
          <button
            type="button"
            onClick={() => onToggleSave(job.id)}
            className={`shrink-0 rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isSaved
                ? "text-positive bg-primary-pale"
                : "text-mute hover:bg-canvas-soft hover:text-ink"
            }`}
            aria-label={isSaved ? "Bỏ lưu việc làm" : "Lưu việc làm"}
            title={isSaved ? "Đã lưu (Bấm để bỏ lưu)" : "Lưu việc làm này"}
          >
            <Bookmark size={18} className={isSaved ? "fill-positive" : ""} />
          </button>
        ) : null}
      </div>

      <div className="space-y-1.5 text-body-sm text-body">
        <p className="flex items-center gap-2"><Building2 size={14} className="text-mute shrink-0" /> <span className="truncate">{job.company}</span></p>
        {job.location ? <p className="flex items-center gap-2"><MapPin size={14} className="text-mute shrink-0" /> <span className="truncate">{job.location}</span></p> : null}
        <p className="flex items-center gap-2"><Wallet size={14} className="text-mute shrink-0" /> <span>{job.salary || "Thương lượng"}</span></p>
        <p className="flex items-center gap-2"><Clock size={14} className="text-mute shrink-0" /> <span>Cập nhật {formatDate(job.crawledAt)}</span></p>
      </div>

      {job.skills?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 7).map((skill) => {
            const isMatch = matchingSkills.has(skill);
            if (isMatch) {
              return (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 rounded-md border border-positive/30 bg-primary-pale/70 px-2 py-0.5 text-caption font-medium text-positive-deep"
                  title="Kỹ năng khớp với hồ sơ của bạn"
                >
                  <Check size={11} className="text-positive" />
                  {skill}
                </span>
              );
            }
            return <SkillTag key={skill}>{skill}</SkillTag>;
          })}
          {job.skills.length > 7 ? (
            <span className="text-caption text-mute self-center">+{job.skills.length - 7}</span>
          ) : null}
        </div>
      ) : null}

      <div className="mt-auto flex gap-2 pt-1">
        <Button variant="primary" leftIcon={<Sparkles size={16} />} className="flex-1" onClick={() => onScreen(job)}>
          Chấm điểm CV
        </Button>
        <a href={job.url} target="_blank" rel="noopener noreferrer">
          <Button variant="secondary">Xem tin</Button>
        </a>
      </div>
    </Card>
  );
}

