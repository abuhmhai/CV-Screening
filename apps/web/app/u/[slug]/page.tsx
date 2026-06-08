"use client";

import { use, useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api-client";
import { PublicProfile } from "../../../lib/types";
import { formatDate } from "../../../lib/format";
import { Card } from "../../../components/ui/card";
import { Avatar } from "../../../components/ui/avatar";
import { Badge } from "../../../components/ui/badge";
import { ErrorBlock, LoadingBlock } from "../../../components/ui/states";
import { GithubIcon, LinkedinIcon, TwitterIcon } from "../../../components/ui/brand-icons";
import {
  Link2,
  Globe,
  X,
  ExternalLink,
  Award,
  FolderGit2,
  Languages as LanguagesIcon,
  MapPin,
  Briefcase
} from "lucide-react";

export default function PublicProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    void apiFetch<PublicProfile>(`/public/users/${encodeURIComponent(slug)}`).then((res) => {
      if (res.ok && res.data) setProfile(res.data);
      else setNotFound(true);
      setLoading(false);
    });
  }, [slug]);

  if (loading) return <LoadingBlock />;
  if (notFound || !profile) {
    return <ErrorBlock message="Hồ sơ này không tồn tại hoặc được đặt ở chế độ riêng tư." />;
  }

  const social = profile.socialLinks ?? null;
  const socialLinks: Array<{ key: string; href: string; icon: React.ReactNode }> = [];
  if (social?.github) socialLinks.push({ key: "github", href: social.github, icon: <GithubIcon size={16} /> });
  if (social?.linkedin) socialLinks.push({ key: "linkedin", href: social.linkedin, icon: <LinkedinIcon size={16} /> });
  if (social?.website) socialLinks.push({ key: "website", href: social.website, icon: <Globe size={16} /> });
  if (social?.portfolio) socialLinks.push({ key: "portfolio", href: social.portfolio, icon: <ExternalLink size={16} /> });
  if (social?.twitter) socialLinks.push({ key: "twitter", href: social.twitter, icon: <TwitterIcon size={16} /> });

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden p-0">
        <div className="h-36 bg-gradient-to-r from-primary to-primary-neutral">
          {profile.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.coverUrl} alt="cover" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="relative px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <Avatar name={profile.fullName} src={profile.avatarUrl} size="xl" />
            <div className="min-w-0">
              <h1 className="text-2xl font-black text-ink">{profile.fullName}</h1>
              {profile.headline ? <p className="text-body">{profile.headline}</p> : null}
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-mute">
                {profile.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} /> {profile.location}
                  </span>
                ) : null}
                {profile.activity ? (
                  <span className="inline-flex items-center gap-1">
                    <Briefcase size={14} /> {profile.activity.applications} đơn ứng tuyển
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          {profile.about ? <p className="mt-6 text-body-md text-body">{profile.about}</p> : null}
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

      {profile.skills.length > 0 ? (
        <Card>
          <h2 className="text-lg font-semibold">Kỹ năng</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <Badge key={s.name} tone="primary">
                {s.name} {s.level ? `· ${s.level}` : ""}
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {profile.experiences.length > 0 ? (
          <Card>
            <h2 className="text-lg font-semibold">Kinh nghiệm</h2>
            <div className="mt-4 space-y-4">
              {profile.experiences.map((exp, i) => (
                <div key={i} className="rounded-lg bg-canvas-soft p-4">
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
        ) : null}

        {profile.educations.length > 0 ? (
          <Card>
            <h2 className="text-lg font-semibold">Học vấn</h2>
            <div className="mt-4 space-y-4">
              {profile.educations.map((edu, i) => (
                <div key={i} className="rounded-lg bg-canvas-soft p-4">
                  <p className="font-semibold">{edu.school}</p>
                  <p className="text-sm text-body">
                    {edu.degree} {edu.major ? `· ${edu.major}` : ""}
                  </p>
                  <p className="text-xs text-mute">
                    {edu.startYear} – {edu.endYear}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        ) : null}
      </div>

      {profile.projects.length > 0 ? (
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FolderGit2 size={18} className="text-primary" /> Dự án
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {profile.projects.map((pr, i) => (
              <div key={i} className="rounded-lg bg-canvas-soft p-4">
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

      {profile.certifications.length > 0 ? (
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Award size={18} className="text-primary" /> Chứng chỉ
          </h2>
          <div className="mt-4 space-y-3">
            {profile.certifications.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-lg bg-canvas-soft p-4">
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

      {(profile.languages ?? []).length > 0 ? (
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <LanguagesIcon size={18} className="text-primary" /> Ngôn ngữ
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(profile.languages ?? []).map((l) => (
              <Badge key={l.name} tone="default">
                {l.name} {l.proficiency ? `· ${l.proficiency}` : ""}
              </Badge>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
