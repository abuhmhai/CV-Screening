"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api-client";
import { useAuth } from "../../../lib/auth-context";
import { Job, UserProfile } from "../../../lib/types";
import { formatSalary } from "../../../lib/format";
import { PageHeader, Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { FieldLabel, Select, Textarea } from "../../../components/ui/input";
import { ErrorBlock, LoadingBlock } from "../../../components/ui/states";

function JobDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token, user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cvFileId, setCvFileId] = useState("");
  const [coverLetter, setCoverLetter] = useState("");

  useEffect(() => {
    void apiFetch<Job>(`/jobs/${params.id}`).then((res) => {
      if (res.ok && res.data) setJob(res.data);
      setLoading(false);
    });
  }, [params.id]);

  useEffect(() => {
    if (!token || !user) return;
    void apiFetch<UserProfile>(`/users/${user.id}/profile`, { token }).then((res) => {
      if (res.ok && res.data) {
        setProfile(res.data);
        const primary = res.data.cvFiles?.find((cv) => cv.isPrimary) ?? res.data.cvFiles?.[0];
        if (primary) setCvFileId(primary.id);
      }
    });
  }, [token, user]);

  async function handleApply(e: FormEvent) {
    e.preventDefault();
    if (!token || !job || !cvFileId) {
      setError("Vui lòng chọn CV để ứng tuyển");
      return;
    }
    setApplying(true);
    setError(null);
    const result = await apiFetch(`/applications`, {
      method: "POST",
      token,
      body: JSON.stringify({ jobId: job.id, cvFileId, coverLetter: coverLetter || undefined })
    });
    setApplying(false);
    if (!result.ok) {
      setError(result.error ?? "Ứng tuyển thất bại");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/applications"), 1500);
  }

  if (loading) return <LoadingBlock />;
  if (!job) return <ErrorBlock message="Không tìm thấy tin tuyển dụng" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={job.title}
        description={`${job.company?.name} · ${job.level} · ${job.jobType} · ${job.location ?? "Remote"}`}
        actions={<StatusBadge status={job.status} />}
      />

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Mô tả công việc</h2>
            <p className="mt-3 whitespace-pre-wrap text-body-md text-body">{job.description}</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Mức lương</h2>
            <p className="mt-2 text-xl font-black text-ink-deep">{formatSalary(job.minSalary, job.maxSalary)}</p>
          </div>
          {job.requiredSkills && job.requiredSkills.length > 0 ? (
            <div>
              <h2 className="text-lg font-semibold">Kỹ năng yêu cầu</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.requiredSkills.map((skill) => (
                  <span key={skill} className="rounded-pill bg-primary-pale px-4 py-2 text-sm font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Ứng tuyển ngay</h2>
          {!user ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-body">Đăng nhập để nộp hồ sơ và nhận AI score.</p>
              <Link href="/auth/sign-in">
                <Button fullWidth>Đăng nhập</Button>
              </Link>
            </div>
          ) : user.role !== "CANDIDATE" ? (
            <p className="mt-4 text-sm text-body">Chỉ tài khoản ứng viên mới có thể ứng tuyển.</p>
          ) : success ? (
            <p className="mt-4 rounded-lg bg-primary-pale p-4 text-sm font-semibold text-ink-deep">
              ✅ Đã gửi đơn! Đang chuyển đến trang ứng tuyển...
            </p>
          ) : (
            <form className="mt-4 space-y-4" onSubmit={handleApply}>
              <FieldLabel label="CV của bạn">
                <Select value={cvFileId} onChange={(e) => setCvFileId(e.target.value)} required>
                  <option value="">Chọn CV</option>
                  {profile?.cvFiles?.map((cv) => (
                    <option key={cv.id} value={cv.id}>
                      {cv.fileName} {cv.isPrimary ? "(Primary)" : ""}
                    </option>
                  ))}
                </Select>
              </FieldLabel>
              <FieldLabel label="Thư giới thiệu">
                <Textarea
                  rows={4}
                  placeholder="Giới thiệu ngắn về bạn và lý do ứng tuyển..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </FieldLabel>
              {error ? <p className="text-sm text-negative">{error}</p> : null}
              <Button type="submit" fullWidth disabled={applying}>
                {applying ? "Đang gửi..." : "Gửi đơn ứng tuyển"}
              </Button>
              <p className="text-xs text-mute">
                Sau khi nộp, hệ thống sẽ chạy AI screening và cập nhật điểm trong vài giây.
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  return <JobDetailContent />;
}
