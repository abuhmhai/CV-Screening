"use client";

import { Building2, Clock, MapPin, Sparkles, Wallet } from "lucide-react";
import { ExternalJob } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { SkillTag } from "../ui/skill-tag";
import { sourceMeta } from "./source-meta";

export function ExternalJobCard({ job, onScreen }: { job: ExternalJob; onScreen: (job: ExternalJob) => void }) {
  const source = sourceMeta(job.source);

  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-ink line-clamp-2">{job.title}</h3>
        <span className={`shrink-0 rounded-pill border px-2.5 py-1 text-[11px] font-bold ${source.badgeClass}`}>
          {source.label}
        </span>
      </div>

      <div className="space-y-1.5 text-body-sm text-body">
        <p className="flex items-center gap-2"><Building2 size={14} className="text-mute" /> {job.company}</p>
        {job.location ? <p className="flex items-center gap-2"><MapPin size={14} className="text-mute" /> {job.location}</p> : null}
        <p className="flex items-center gap-2"><Wallet size={14} className="text-mute" /> {job.salary || "Thương lượng"}</p>
        <p className="flex items-center gap-2"><Clock size={14} className="text-mute" /> Cập nhật {formatDate(job.crawledAt)}</p>
      </div>

      {job.skills?.length ? (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 6).map((skill) => (
            <SkillTag key={skill}>{skill}</SkillTag>
          ))}
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
