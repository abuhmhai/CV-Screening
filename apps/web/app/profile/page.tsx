"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import {
  OnboardingChecklist,
  ProfileDashboard,
  ProfileInsights,
  UserProfile
} from "../../lib/types";
import { formatDate } from "../../lib/format";
import { AuthGate } from "../../components/auth-gate";
import { Card } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ErrorBlock, LoadingBlock } from "../../components/ui/states";
import { ProfileEditor } from "../../components/profile-editor";
import { CompletenessCard } from "../../components/profile/completeness-card";
import { InsightsCard } from "../../components/profile/insights-card";
import { DashboardCard } from "../../components/profile/dashboard-card";
import { CvManager } from "../../components/profile/cv-manager";
import {
  Pencil,
  Eye,
  FileText,
  Share2,
  Github,
  Linkedin,
  Globe,
  Twitter,
  Award,
  FolderGit2,
  Languages as LanguagesIcon,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function ProfileContent() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [insights, setInsights] = useState<ProfileInsights | null>(null);
  const [dashboard, setDashboard] = useState<ProfileDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [sharing, setSharing] = useState(false);

  const loadProfile = useCallback(() => {
    if (!token || !user) return;
    void apiFetch<UserProfile>(`/users/${user.id}/profile`, { token }).then((res) => {
      if (res.ok && res.data) setProfile(res.data);
      setLoading(false);
    });
    void apiFetch<OnboardingChecklist>("/users/me/onboarding-checklist", { token }).then((res) => {
      if (res.ok && res.data) setChecklist(res.data);
    });
    void apiFetch<ProfileInsights>("/users/me/insights", { token }).then((res) => {
      if (res.ok && res.data) setInsights(res.data);
    });
    void apiFetch<ProfileDashboard>("/users/me/dashboard", { token }).then((res) => {
      if (res.ok && res.data) setDashboard(res.data);
    });
  }, [token, user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const sharePublic = async () => {
    if (!token) return;
    setSharing(true);
    try {
      const res = await apiFetch<{ slug: string }>("/users/me/public-slug", { method: "POST", token });
      if (res.ok && res.data) {
        const url = `${window.location.origin}/u/${res.data.slug}`;
        try {
          await navigator.clipboard.writeText(url);
          toast.success("Đã sao chép liên kết hồ sơ công khai");
        } catch {
          toast.success(url);
        }
        window.open(url, "_blank");
      } else {
        toast.error(res.error ?? "Không tạo được liên kết");
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (!profile) return <ErrorBlock message="Không tải được hồ sơ" />;

  const p = profile.profile;
  const social = p?.socialLinks ?? null;
  const socialLinks: Array<{ key: string; href: string; icon: React.ReactNode }> = [];
  if (social?.github) socialLinks.push({ key: "github", href: social.github, icon: <Github size={16} /> });
  if (social?.linkedin) socialLinks.push({ key: "linkedin", href: social.linkedin, icon: <Linkedin size={16} /> });
  if (social?.website) socialLinks.push({ key: "website", href: social.website, icon: <Globe size={16} /> });
  if (social?.portfolio) socialLinks.push({ key: "portfolio", href: social.portfolio, icon: <ExternalLink size={16} /> });
  if (social?.twitter) socialLinks.push({ key: "twitter", href: social.twitter, icon: <Twitter size={16} /> });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={editing ? "tertiary" : "primary"}
            onClick={() => setEditing((v) => !v)}
            leftIcon={editing ? <Eye size={16} /> : <Pencil size={16} />}
            className="min-h-10 px-4 py-2"
          >
            {editing ? "Xem hồ sơ" : "Chỉnh sửa hồ sơ"}
          </Button>
          <Button
            variant="ghost"
            onClick={sharePublic}
            isLoading={sharing}
            leftIcon={<Share2 size={16} />}
            className="min-h-10 px-4 py-2"
          >
            Chia sẻ hồ sơ
          </Button>
          <Link href="/cv-builder">
            <Button variant="ghost" leftIcon={<FileText size={16} />} className="min-h-10 px-4 py-2">
              Tạo CV
            </Button>
          </Link>
        </div>
      </div>

      {editing ? (
        <ProfileEditor profile={profile} onChange={loadProfile} />
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <div className="h-32 bg-gradient-to-r from-primary to-primary-neutral">
              {p?.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverUrl} alt="cover" className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="relative px-6 pb-6">
              <div className="-mt-10 flex flex-wrap items-end gap-4">
                <Avatar name={p?.fullName} email={profile.email} src={p?.avatarUrl} size="xl" />
                <div className="min-w-0">
                  <h1 className="text-2xl font-black text-ink">{p?.fullName ?? profile.email}</h1>
                  <p className="text-body">{p?.headline ?? "Professional profile"}</p>
                  <p className="text-sm text-mute">{p?.location ?? "—"}</p>
                </div>
              </div>
              {p?.about ? <p className="mt-6 text-body-md text-body">{p.about}</p> : null}
              {socialLinks.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {socialLinks.map((l) => (
                    <a
                      key={l.key}
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline-strong bg-surface-card text-body transition hover:border-hairline hover:text-primary"
                      aria-label={l.key}
                    >
                      {l.icon}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          </Card>

          <CompletenessCard checklist={checklist} />

          <div className="grid gap-6 lg:grid-cols-2">
            <InsightsCard insights={insights} />
            <DashboardCard dashboard={dashboard} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="text-lg font-semibold">Kinh nghiệm</h2>
              <div className="mt-4 space-y-4">
                {(profile.workExperiences ?? []).length === 0 ? (
                  <p className="text-body-sm text-mute">Chưa có kinh nghiệm.</p>
                ) : null}
                {(profile.workExperiences ?? []).map((exp) => (
                  <div key={exp.id} className="rounded-lg bg-canvas-soft p-4">
                    <p className="font-semibold text-ink">{exp.position}</p>
                    <p className="text-sm text-body">{exp.company}</p>
                    <p className="mt-1 text-xs text-mute">
                      {formatDate(exp.startDate)} – {exp.isCurrent ? "Hiện tại" : formatDate(exp.endDate)}
                    </p>
                    {exp.description ? <p className="mt-2 text-sm text-body">{exp.description}</p> : null}
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Học vấn</h2>
              <div className="mt-4 space-y-4">
                {(profile.educations ?? []).length === 0 ? (
                  <p className="text-body-sm text-mute">Chưa có học vấn.</p>
                ) : null}
                {(profile.educations ?? []).map((edu) => (
                  <div key={edu.id} className="rounded-lg bg-canvas-soft p-4">
                    <p className="font-semibold">{edu.school}</p>
                    <p className="text-sm text-body">
                      {edu.degree} {edu.major ? `· ${edu.major}` : ""}
                    </p>
                    <p className="text-xs text-mute">
                      {edu.startYear} – {edu.endYear} {edu.gpa ? `· GPA ${edu.gpa}` : ""}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card>
            <h2 className="text-lg font-semibold">Kỹ năng</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {(profile.userSkills ?? []).length === 0 ? (
                <p className="text-body-sm text-mute">Chưa có kỹ năng.</p>
              ) : null}
              {(profile.userSkills ?? []).map((item) => (
                <Badge key={item.skill.id} tone="primary">
                  {item.skill.name} {item.level ? `· ${item.level}` : ""}
                </Badge>
              ))}
            </div>
          </Card>

          {(profile.projects ?? []).length > 0 ? (
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FolderGit2 size={18} className="text-primary" /> Dự án
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {(profile.projects ?? []).map((pr) => (
                  <div key={pr.id} className="rounded-lg bg-canvas-soft p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-ink">{pr.title}</p>
                      {pr.url ? (
                        <a href={pr.url} target="_blank" rel="noreferrer" className="text-primary" aria-label="Mở dự án">
                          <ExternalLink size={15} />
                        </a>
                      ) : null}
                    </div>
                    {pr.description ? <p className="mt-1 text-sm text-body">{pr.description}</p> : null}
                    {pr.skills && pr.skills.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {pr.skills.map((s) => (
                          <Badge key={s} tone="default">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {(profile.certifications ?? []).length > 0 ? (
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Award size={18} className="text-primary" /> Chứng chỉ
              </h2>
              <div className="mt-4 space-y-3">
                {(profile.certifications ?? []).map((c) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg bg-canvas-soft p-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">{c.name}</p>
                      <p className="text-sm text-body">
                        {c.issuer} {c.issueDate ? `· ${formatDate(c.issueDate)}` : ""}
                      </p>
                    </div>
                    {c.credentialUrl ? (
                      <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-primary" aria-label="Xác thực">
                        <ExternalLink size={15} />
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          {(p?.languages ?? []).length > 0 ? (
            <Card>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <LanguagesIcon size={18} className="text-primary" /> Ngôn ngữ
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {(p?.languages ?? []).map((l) => (
                  <Badge key={l.name} tone="default">
                    {l.name} {l.proficiency ? `· ${l.proficiency}` : ""}
                  </Badge>
                ))}
              </div>
            </Card>
          ) : null}

          <CvManager profile={profile} onChange={loadProfile} />
        </>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <AuthGate>
      <ProfileContent />
    </AuthGate>
  );
}
