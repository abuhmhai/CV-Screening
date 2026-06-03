"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { UserProfile } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { AuthGate } from "../../components/auth-gate";
import { Card } from "../../components/ui/card";
import { Avatar } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { ErrorBlock, LoadingBlock } from "../../components/ui/states";
import { ProfileEditor } from "../../components/profile-editor";
import { Pencil, Eye, FileText } from "lucide-react";
import Link from "next/link";

function ProfileContent() {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const loadProfile = () => {
    if (!token || !user) return;
    void apiFetch<UserProfile>(`/users/${user.id}/profile`, { token }).then((res) => {
      if (res.ok && res.data) setProfile(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  if (loading) return <LoadingBlock />;
  if (!profile) return <ErrorBlock message="Không tải được hồ sơ" />;

  const p = profile.profile;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={editing ? "tertiary" : "primary"}
            onClick={() => setEditing((v) => !v)}
            leftIcon={editing ? <Eye size={16} /> : <Pencil size={16} />}
            className="min-h-10 px-4 py-2"
          >
            {editing ? "Xem hồ sơ" : "Chỉnh sửa hồ sơ"}
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
        <div className="h-32 bg-gradient-to-r from-primary to-primary-neutral" />
        <div className="relative px-6 pb-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <Avatar name={p?.fullName} email={profile.email} src={p?.avatarUrl} size="lg" />
            <div>
              <h1 className="text-2xl font-black text-ink">{p?.fullName ?? profile.email}</h1>
              <p className="text-body">{p?.headline ?? "Professional profile"}</p>
              <p className="text-sm text-mute">{p?.location ?? "—"}</p>
            </div>
          </div>
          {p?.about ? <p className="mt-6 text-body-md text-body">{p.about}</p> : null}
          {p?.profileCompleteness ? (
            <div className="mt-4 inline-flex rounded-pill bg-primary-pale px-4 py-2 text-sm font-semibold">
              Profile completeness: {p.profileCompleteness}%
            </div>
          ) : null}
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Kinh nghiệm</h2>
          <div className="mt-4 space-y-4">
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
            {(profile.educations ?? []).map((edu) => (
              <div key={edu.id} className="rounded-lg bg-canvas-soft p-4">
                <p className="font-semibold">{edu.school}</p>
                <p className="text-sm text-body">
                  {edu.degree} · {edu.major}
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
          {(profile.userSkills ?? []).map((item) => (
            <Badge key={item.skill.id} tone="primary">
              {item.skill.name} {item.level ? `· ${item.level}` : ""}
            </Badge>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">CV đã lưu</h2>
        <ul className="mt-4 space-y-2">
          {(profile.cvFiles ?? []).map((cv) => (
            <li key={cv.id} className="flex items-center justify-between rounded-lg bg-canvas-soft px-4 py-3 text-sm">
              <span>{cv.fileName}</span>
              {cv.isPrimary ? <Badge tone="positive">Primary</Badge> : null}
            </li>
          ))}
        </ul>
      </Card>
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
