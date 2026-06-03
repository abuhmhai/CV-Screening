"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronLeft,
  Download,
  FileText,
  GraduationCap,
  Mail,
  MapPin,
  Sparkles,
  UserCircle2
} from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api-client";
import { Application } from "../lib/types";
import { formatDate } from "../lib/format";
import { Badge, StatusBadge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, PageHeader } from "./ui/card";
import { ErrorBlock, LoadingBlock } from "./ui/states";

type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

type CriteriaItem = {
  key: "skills" | "experience" | "education" | "other";
  label: string;
  score: number;
  weight: number;
  benchmark: number;
};

const dummyData = {
  jobTitle: "Backend Engineer",
  company: "TalentFlow Vietnam",
  location: "Ho Chi Minh City",
  candidateName: "Nguyen Minh Khoa",
  candidateEmail: "khoa.nguyen@example.com",
  headline: "Backend Engineer | Node.js | PostgreSQL | Redis",
  bio: "5+ years building scalable recruitment and fintech APIs, strong ownership mindset, and production incident response experience.",
  cvFileName: "Nguyen-Minh-Khoa-Backend-Engineer-CV.pdf",
  cvFileUrl: "#",
  coverLetter:
    "I am excited to contribute to TalentFlow's hiring intelligence platform by improving backend reliability and data quality for AI screening workflows.",
  requiredSkills: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker", "AWS"],
  skills: [
    { name: "Node.js", years: 5, level: "EXPERT" as SkillLevel },
    { name: "TypeScript", years: 4, level: "ADVANCED" as SkillLevel },
    { name: "PostgreSQL", years: 4, level: "ADVANCED" as SkillLevel },
    { name: "Redis", years: 3, level: "INTERMEDIATE" as SkillLevel },
    { name: "Docker", years: 3, level: "INTERMEDIATE" as SkillLevel }
  ],
  experiences: [
    {
      id: "exp-1",
      position: "Senior Backend Engineer",
      company: "SaaSFlow",
      startDate: "2022-01-01",
      endDate: null,
      isCurrent: true,
      description: "Led API architecture for a multi-tenant B2B platform and reduced p95 latency by 32%."
    },
    {
      id: "exp-2",
      position: "Backend Engineer",
      company: "CloudRecruit",
      startDate: "2019-06-01",
      endDate: "2021-12-01",
      isCurrent: false,
      description: "Built interview scheduling and notification services with event-driven architecture."
    }
  ],
  educations: [
    { id: "edu-1", school: "HCMUT", degree: "B.Sc Computer Science", major: "Software Engineering", startYear: 2015, endYear: 2019, gpa: "3.42" }
  ],
  overallScore: 84,
  grade: "B",
  processingTimeMs: 1820,
  criteria: [
    { key: "skills", label: "Kỹ năng chuyên môn", score: 88, weight: 40, benchmark: 75 },
    { key: "experience", label: "Kinh nghiệm làm việc", score: 82, weight: 30, benchmark: 70 },
    { key: "education", label: "Nền tảng học vấn", score: 78, weight: 20, benchmark: 65 },
    { key: "other", label: "Tiêu chí khác", score: 80, weight: 10, benchmark: 60 }
  ] as CriteriaItem[],
  matchedSkills: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Docker"],
  missingSkills: ["AWS"],
  strengths: [
    "Backend skills align strongly with JD requirements and production use-cases.",
    "Demonstrates strong API design and ownership in cross-functional projects.",
    "Clear impact metrics and stable tenure in recent role."
  ],
  concerns: ["Cloud deployment experience on AWS is limited; needs ramp-up for infra-heavy responsibilities."],
  explanation: "Candidate is highly suitable for technical interview with focus on cloud architecture depth."
};

function toNumber(value: string | number | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : fallback;
}

function gradeTone(grade: string) {
  if (grade.startsWith("A")) return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (grade.startsWith("B")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (grade.startsWith("C")) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

function levelTone(level?: string | null) {
  if (level === "EXPERT") return "bg-emerald-100 text-emerald-700";
  if (level === "ADVANCED") return "bg-blue-100 text-blue-700";
  if (level === "INTERMEDIATE") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function formatExperienceRange(startDate: string, endDate?: string | null, isCurrent?: boolean) {
  return `${formatDate(startDate)} - ${isCurrent ? "Hiện tại" : formatDate(endDate)}`;
}

export function AiScoreDetailRedesign() {
  const params = useParams<{ id: string }>();
  const { token, user } = useAuth();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rescreening, setRescreening] = useState(false);

  const loadApplication = useCallback(async () => {
    if (!token) return;
    const res = await apiFetch<Application>(`/applications/${params.id}`, { token });
    if (!res.ok) {
      setError(res.error ?? "Không tải được chi tiết AI Score.");
      setLoading(false);
      return;
    }
    setApplication(res.data ?? null);
    setError(null);
    setLoading(false);
  }, [params.id, token]);

  useEffect(() => {
    void loadApplication();
  }, [loadApplication]);

  const view = useMemo(() => {
    const ai = application?.aiResult;
    const criteria: CriteriaItem[] = [
      { key: "skills", label: "Kỹ năng chuyên môn", score: toNumber(ai?.skillScore, dummyData.criteria[0].score), weight: 40, benchmark: 75 },
      { key: "experience", label: "Kinh nghiệm làm việc", score: toNumber(ai?.experienceScore, dummyData.criteria[1].score), weight: 30, benchmark: 70 },
      { key: "education", label: "Nền tảng học vấn", score: toNumber(ai?.educationScore, dummyData.criteria[2].score), weight: 20, benchmark: 65 },
      { key: "other", label: "Tiêu chí khác", score: toNumber(ai?.otherScore, dummyData.criteria[3].score), weight: 10, benchmark: 60 }
    ];

    return {
      jobTitle: application?.job?.title ?? dummyData.jobTitle,
      company: application?.job?.company?.name ?? dummyData.company,
      location: application?.job?.location ?? dummyData.location,
      candidateName: application?.candidate?.profile?.fullName ?? dummyData.candidateName,
      candidateEmail: application?.candidate?.email ?? dummyData.candidateEmail,
      headline: application?.candidate?.profile?.headline ?? dummyData.headline,
      bio: application?.candidate?.profile?.about ?? dummyData.bio,
      cvFileName: application?.cvFile?.fileName ?? dummyData.cvFileName,
      cvFileUrl: application?.cvFile?.fileUrl ?? dummyData.cvFileUrl,
      coverLetter: application?.coverLetter ?? dummyData.coverLetter,
      requiredSkills: application?.job?.requiredSkills?.length ? application.job.requiredSkills : dummyData.requiredSkills,
      skills: application?.candidate?.userSkills?.length
        ? application.candidate.userSkills.map((item) => ({
            name: item.skill.name,
            years: toNumber(item.yearsExp, 0),
            level: (item.level as SkillLevel | undefined) ?? "BEGINNER"
          }))
        : dummyData.skills,
      experiences: application?.candidate?.workExperiences?.length ? application.candidate.workExperiences : dummyData.experiences,
      educations: application?.candidate?.educations?.length ? application.candidate.educations : dummyData.educations,
      overallScore: toNumber(ai?.overallScore, dummyData.overallScore),
      grade: ai?.grade ?? dummyData.grade,
      processingTimeMs: ai?.processingTimeMs ?? dummyData.processingTimeMs,
      criteria,
      matchedSkills: ai?.matchedSkills?.length ? ai.matchedSkills : dummyData.matchedSkills,
      missingSkills: ai?.missingSkills?.length ? ai.missingSkills : dummyData.missingSkills,
      strengths: ai?.strengths?.length ? ai.strengths : dummyData.strengths,
      concerns: ai?.concerns?.length ? ai.concerns : dummyData.concerns,
      explanation: ai?.explanation ?? dummyData.explanation
    };
  }, [application]);

  async function triggerRescreen() {
    if (!token || !application?.id) return;
    setRescreening(true);
    await apiFetch(`/applications/${application.id}/rescreen`, { method: "POST", token });
    setRescreening(false);
    void loadApplication();
  }

  if (loading) return <LoadingBlock label="Đang tải AI Score Detail..." />;
  if (error) return <ErrorBlock message={error} />;

  const scorePct = Math.max(0, Math.min(100, view.overallScore));
  const canRescreen = user?.role === "RECRUITER" || user?.role === "ADMIN";

  return (
    <div className="space-y-6">
      <Link href="/applications" className="inline-flex items-center text-sm font-semibold text-body hover:text-ink-deep">
        <ChevronLeft size={16} className="mr-1" /> Quay lại danh sách
      </Link>

      <PageHeader
        title={view.jobTitle}
        description={`${view.company} · ${view.location}`}
        actions={
          <>
            <a href={view.cvFileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" leftIcon={<FileText size={16} />}>Xem CV</Button>
            </a>
            {canRescreen ? (
              <Button variant="tertiary" leftIcon={<Sparkles size={16} />} isLoading={rescreening} onClick={() => void triggerRescreen()}>
                AI Screening
              </Button>
            ) : null}
            {application?.status ? <StatusBadge status={application.status} /> : null}
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5">
          <div className="grid gap-5 md:grid-cols-[1fr_1.2fr]">
            <div className="rounded-xl border border-ink/10 bg-canvas-soft p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-body">Score Overview</p>
              <div className="mt-4 flex items-center justify-center">
                <div className="relative h-40 w-40">
                  <svg className="h-40 w-40 -rotate-90">
                    <circle cx="80" cy="80" r="66" strokeWidth="14" className="stroke-ink/10 fill-none" />
                    <circle
                      cx="80"
                      cy="80"
                      r="66"
                      strokeWidth="14"
                      className="fill-none stroke-emerald-500"
                      strokeDasharray={414}
                      strokeDashoffset={414 - (414 * scorePct) / 100}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-black text-ink">{view.overallScore.toFixed(1)}</p>
                    <p className="text-xs font-semibold text-body">/100</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center">
                <span className={`rounded-pill border px-4 py-1.5 text-sm font-bold ${gradeTone(view.grade)}`}>Grade {view.grade}</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-ink">Công thức trọng số</p>
              <p className="rounded-lg bg-canvas-soft p-3 text-sm text-body">Overall = Skills 40% + Experience 30% + Education 20% + Others 10%</p>
              <p className="flex items-center gap-2 text-xs text-body">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
                Processed in {view.processingTimeMs}ms
              </p>
              <p className="rounded-lg border border-ink/10 bg-canvas p-3 text-sm text-body">{view.explanation}</p>
            </div>
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Criteria Breakdown</h2>
            <Badge tone="primary">Benchmark visible</Badge>
          </div>
          {view.criteria.map((item) => {
            const contribution = (item.score * item.weight) / 100;
            return (
              <div key={item.key} className="space-y-2 rounded-xl bg-canvas-soft p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <p className="font-semibold text-ink">{item.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded-pill bg-canvas px-2 py-1 text-xs font-semibold text-body">Weight {item.weight}%</span>
                    <span className="text-sm font-bold text-ink">{item.score.toFixed(1)}</span>
                    <span className="text-xs font-semibold text-body">Contribution {contribution.toFixed(1)} pts</span>
                  </div>
                </div>
                <div className="relative h-3 rounded-pill bg-white">
                  <div className="h-3 rounded-pill bg-emerald-500" style={{ width: `${item.score}%` }} />
                  <span className="absolute -top-1 h-5 w-0.5 bg-amber-600" style={{ left: `${item.benchmark}%` }} />
                </div>
                <p className="text-xs text-body">Benchmark: {item.benchmark}</p>
              </div>
            );
          })}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-ink">Candidate Profile</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body">Name</p><p className="font-semibold text-ink">{view.candidateName}</p></div>
            <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body flex items-center gap-1"><Mail size={12} /> Email</p><p className="font-semibold text-ink break-all">{view.candidateEmail}</p></div>
            <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body">Headline</p><p className="font-semibold text-ink">{view.headline}</p></div>
            <div className="rounded-lg bg-canvas-soft p-3"><p className="text-xs text-body flex items-center gap-1"><MapPin size={12} /> Location</p><p className="font-semibold text-ink">{view.location}</p></div>
          </div>
          <p className="rounded-lg bg-canvas-soft p-3 text-sm text-body">{view.bio}</p>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-pill bg-canvas-soft px-3 py-1 text-xs font-semibold text-ink">{view.cvFileName}</span>
            <span className="rounded-pill bg-canvas-soft px-3 py-1 text-xs font-semibold text-ink">Cover Letter</span>
          </div>
          <p className="rounded-lg border border-ink/10 bg-canvas p-3 text-sm text-body">{view.coverLetter}</p>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-ink">JD Matching</h2>
          <div className="rounded-lg bg-canvas-soft p-3 text-sm">
            <p className="font-semibold text-ink">{view.jobTitle}</p>
            <p className="text-body">{view.company}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {view.requiredSkills.map((skill) => {
              const matched = view.matchedSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
              const missing = view.missingSkills.some((s) => s.toLowerCase() === skill.toLowerCase());
              return (
                <span key={skill} className={`rounded-pill px-3 py-1 text-xs font-semibold ${matched ? "bg-emerald-100 text-emerald-700" : missing ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                  {skill}
                </span>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-emerald-100 p-3 text-center"><p className="text-xs text-emerald-700">Matched</p><p className="text-2xl font-black text-emerald-700">{view.matchedSkills.length}</p></div>
            <div className="rounded-lg bg-red-100 p-3 text-center"><p className="text-xs text-red-700">Missing</p><p className="text-2xl font-black text-red-700">{view.missingSkills.length}</p></div>
            <div className="rounded-lg bg-slate-100 p-3 text-center"><p className="text-xs text-slate-700">Total Skills</p><p className="text-2xl font-black text-slate-700">{view.skills.length}</p></div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-ink">Skills Table</h2>
          <div className="overflow-x-auto rounded-xl border border-ink/10">
            <table className="min-w-full text-sm">
              <thead className="bg-canvas-soft text-left text-body">
                <tr>
                  <th className="px-3 py-2">Skill</th>
                  <th className="px-3 py-2">Years</th>
                  <th className="px-3 py-2">Level</th>
                </tr>
              </thead>
              <tbody>
                {view.skills.map((skill) => (
                  <tr key={skill.name} className="border-t border-ink/10">
                    <td className="px-3 py-2 font-semibold text-ink">{skill.name}</td>
                    <td className="px-3 py-2 text-body">{skill.years}</td>
                    <td className="px-3 py-2"><span className={`rounded-pill px-2 py-1 text-xs font-semibold ${levelTone(skill.level)}`}>{skill.level}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-lg font-bold text-ink">Skill Analysis</h2>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 size={16} /> Matched Skills</p>
            <div className="flex flex-wrap gap-2">{view.matchedSkills.map((skill) => <span key={skill} className="rounded-pill bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{skill}</span>)}</div>
          </div>
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700"><AlertTriangle size={16} /> Missing Skills</p>
            <div className="flex flex-wrap gap-2">{view.missingSkills.map((skill) => <span key={skill} className="rounded-pill bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">{skill}</span>)}</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><BriefcaseBusiness size={18} /> Experience</h2>
          {view.experiences.map((exp) => (
            <div key={exp.id} className="rounded-xl bg-canvas-soft p-4">
              <p className="font-semibold text-ink">{exp.position}</p>
              <p className="text-sm text-body">{exp.company}</p>
              <p className="text-xs text-body mt-1">{formatExperienceRange(exp.startDate, exp.endDate, exp.isCurrent)}</p>
              {exp.description ? <p className="mt-2 text-sm text-body">{exp.description}</p> : null}
            </div>
          ))}
        </Card>

        <Card className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink"><GraduationCap size={18} /> Education</h2>
          {view.educations.map((edu) => (
            <div key={edu.id} className="rounded-xl bg-canvas-soft p-4">
              <p className="font-semibold text-ink">{edu.school}</p>
              <p className="text-sm text-body">{edu.degree}{edu.major ? ` · ${edu.major}` : ""}</p>
              <p className="text-xs text-body mt-1">{edu.startYear ?? "—"} - {edu.endYear ?? "Current"}{edu.gpa ? ` · GPA ${edu.gpa}` : ""}</p>
            </div>
          ))}
        </Card>
      </div>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold text-ink">Detailed Review</h2>
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-xl bg-emerald-100/50 p-4">
            <p className="mb-3 text-sm font-semibold text-emerald-700">Strengths</p>
            <ul className="space-y-2 text-sm text-ink">
              {view.strengths.map((item) => (
                <li key={item} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 text-emerald-700" /><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-amber-100/50 p-4">
            <p className="mb-3 text-sm font-semibold text-amber-700">Warnings</p>
            <ul className="space-y-2 text-sm text-ink">
              {view.concerns.map((item) => (
                <li key={item} className="flex gap-2"><AlertTriangle size={16} className="mt-0.5 text-amber-700" /><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="rounded-lg border border-ink/10 bg-canvas-soft p-3 text-xs text-body">
          AI disclaimer: Kết quả AI chỉ hỗ trợ sàng lọc ban đầu và không thay thế quyết định tuyển dụng cuối cùng của HR.
        </p>
      </Card>

      <div className="flex justify-end">
        <a href={view.cvFileUrl} target="_blank" rel="noopener noreferrer">
          <Button leftIcon={<Download size={16} />}>Xem CV</Button>
        </a>
      </div>
    </div>
  );
}

