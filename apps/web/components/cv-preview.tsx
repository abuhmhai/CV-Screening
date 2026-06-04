"use client";

import { GeneratedCvData } from "../lib/types";

function formatRange(start?: string, end?: string): string {
  const s = start ? start.slice(0, 10) : "";
  const e = end ? end.slice(0, 10) : "Hiện tại";
  return [s, e].filter(Boolean).join(" – ");
}

export function CvPreview({
  data,
  templateId
}: {
  data: GeneratedCvData;
  templateId: string;
}) {
  const modern = templateId === "modern";
  const accent = modern ? "text-link" : "text-positive";
  const accentBorder = modern ? "border-link" : "border-positive";
  const contact = [data.email, data.phone, data.location].filter(Boolean).join("  •  ");

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-8 text-slate-800 shadow-sm">
      <header className={modern ? "border-b-2 pb-4 " + accentBorder : ""}>
        <h1 className={`text-3xl font-black ${accent}`}>{data.fullName || "Họ và tên"}</h1>
        {data.headline && <p className="mt-1 text-lg text-slate-700">{data.headline}</p>}
        {contact && <p className="mt-2 text-sm text-slate-500">{contact}</p>}
      </header>

      {!modern && <div className={`mt-4 border-t-2 ${accentBorder}`} />}

      {data.summary && (
        <section className="mt-5">
          <h2 className={`text-xs font-bold uppercase tracking-widest ${accent}`}>Giới thiệu</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{data.summary}</p>
        </section>
      )}

      {(data.experiences ?? []).length > 0 && (
        <section className="mt-5">
          <h2 className={`text-xs font-bold uppercase tracking-widest ${accent}`}>Kinh nghiệm</h2>
          <div className="mt-2 space-y-3">
            {(data.experiences ?? []).map((exp, i) => (
              <div key={i}>
                <p className="font-semibold text-slate-900">
                  {exp.position || "Vị trí"}
                  {exp.company ? ` — ${exp.company}` : ""}
                </p>
                {(exp.startDate || exp.endDate) && (
                  <p className="text-xs text-slate-500">{formatRange(exp.startDate, exp.endDate)}</p>
                )}
                {exp.description && (
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{exp.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {(data.educations ?? []).length > 0 && (
        <section className="mt-5">
          <h2 className={`text-xs font-bold uppercase tracking-widest ${accent}`}>Học vấn</h2>
          <div className="mt-2 space-y-2">
            {(data.educations ?? []).map((edu, i) => (
              <div key={i}>
                <p className="font-semibold text-slate-900">
                  {edu.degree || "Bằng cấp"}
                  {edu.major ? `, ${edu.major}` : ""}
                </p>
                <p className="text-xs text-slate-500">
                  {[edu.school, [edu.startYear, edu.endYear].filter(Boolean).join(" – ")]
                    .filter(Boolean)
                    .join("  •  ")}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(data.skills ?? []).length > 0 && (
        <section className="mt-5">
          <h2 className={`text-xs font-bold uppercase tracking-widest ${accent}`}>Kỹ năng</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(data.skills ?? []).map((skill, i) => (
              <span
                key={i}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  modern ? "bg-accent-blue-glow text-link" : "bg-accent-green-glow text-positive"
                }`}
              >
                {skill.name}
                {skill.level ? ` · ${skill.level}` : ""}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
