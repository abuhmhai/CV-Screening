"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { apiFetch, getApiBase } from "../../lib/api-client";
import { useAuth } from "../../lib/auth-context";
import { CvScreeningReport, ExternalJob, UserProfile } from "../../lib/types";
import { Button } from "../ui/button";
import { FieldLabel, Select } from "../ui/input";
import { CountUp } from "../ui/count-up";
import { LoaderOverlay } from "../ui/loader";
import { sourceMeta } from "./source-meta";

function scoreTone(score: number) {
  if (score >= 70) return { ring: "stroke-positive", text: "text-positive", badge: "bg-accent-green-glow text-positive border border-hairline-strong" };
  if (score >= 50) return { ring: "stroke-warning", text: "text-warning", badge: "bg-accent-yellow-glow text-warning border border-hairline-strong" };
  return { ring: "stroke-negative", text: "text-negative", badge: "bg-accent-red-glow text-negative border border-hairline-strong" };
}

export function CvScreeningPanel({ job, onClose }: { job: ExternalJob | null; onClose: () => void }) {
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cvFileId, setCvFileId] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [uploadingCv, setUploadingCv] = useState(false);
  const [screening, setScreening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CvScreeningReport | null>(null);

  const loadProfile = useCallback(async () => {
    if (!token || !user) return;
    setLoadingProfile(true);
    const res = await apiFetch<UserProfile>(`/users/${user.id}/profile`, { token });
    if (res.ok && res.data) {
      setProfile(res.data);
      const primary = res.data.cvFiles?.find((cv) => cv.isPrimary) ?? res.data.cvFiles?.[0];
      if (primary) setCvFileId(primary.id);
    }
    setLoadingProfile(false);
  }, [token, user]);

  useEffect(() => {
    if (job && token && user) {
      void loadProfile();
    }
  }, [job, token, user, loadProfile]);

  const reset = () => {
    setCvFileId("");
    setProfile(null);
    setReport(null);
    setError(null);
    setUploadingCv(false);
    setScreening(false);
  };

  const close = () => {
    reset();
    onClose();
  };

  async function handleCvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File CV không được vượt quá 5MB");
      return;
    }

    setUploadingCv(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${getApiBase()}/api/v1/users/me/cv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        const msg = Array.isArray(errorData.message) ? errorData.message.join(", ") : errorData.message;
        throw new Error(msg || "Tải lên CV thất bại");
      }

      const uploaded = (await res.json()) as { id: string };
      await loadProfile();
      if (uploaded.id) setCvFileId(uploaded.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setUploadingCv(false);
      e.target.value = "";
    }
  }

  async function runScreening() {
    if (!job) return;
    if (!token) {
      setError("Bạn cần đăng nhập để sử dụng tính năng chấm điểm AI.");
      return;
    }
    if (!cvFileId) {
      setError("Vui lòng chọn CV hoặc tải lên file CV mới.");
      return;
    }
    setScreening(true);
    setError(null);
    setReport(null);
    const res = await apiFetch<CvScreeningReport>(`/external-jobs/${job.id}/screen`, {
      method: "POST",
      token,
      body: JSON.stringify({ cvFileId })
    });
    setScreening(false);
    if (res.ok && res.data) {
      setReport(res.data);
    } else {
      setError(res.error ?? "Không thể chấm điểm CV lúc này.");
    }
  }

  const tone = report ? scoreTone(report.score) : null;
  const circumference = 326;
  const isCandidate = user?.role === "CANDIDATE";

  return (
    <AnimatePresence>
      {job ? (
        <>
          <LoaderOverlay
            show={uploadingCv || screening}
            label={uploadingCv ? "Đang tải lên CV..." : "Đang chấm điểm với AI..."}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ink/40"
            onClick={close}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto bg-canvas shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-ink/10 p-5">
              <div>
                <span className={`rounded-pill border px-2.5 py-0.5 text-[11px] font-bold ${sourceMeta(job.source).badgeClass}`}>
                  {sourceMeta(job.source).label}
                </span>
                <h2 className="mt-2 text-lg font-bold text-ink">{job.title}</h2>
                <p className="text-body-sm text-body">{job.company}{job.location ? ` · ${job.location}` : ""}</p>
              </div>
              <button type="button" onClick={close} className="rounded-full p-2 text-body hover:bg-canvas-soft" aria-label="Đóng">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 space-y-5 p-5">
              {job.skills?.length ? (
                <div>
                  <p className="mb-2 text-body-sm font-semibold text-ink">Kỹ năng yêu cầu</p>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((skill) => (
                      <span key={skill} className="rounded-pill bg-canvas-soft px-3 py-1 text-xs font-semibold text-ink">{skill}</span>
                    ))}
                  </div>
                </div>
              ) : null}

              {!token ? (
                <div className="space-y-3 rounded-xl border border-ink/10 bg-canvas-soft p-4">
                  <p className="text-sm text-body">Đăng nhập để chọn hoặc tải CV và nhận điểm phù hợp từ AI.</p>
                  <Link href="/auth/sign-in">
                    <Button variant="primary" className="w-full">Đăng nhập</Button>
                  </Link>
                </div>
              ) : !isCandidate ? (
                <p className="rounded-lg border border-hairline-strong bg-accent-yellow-glow p-3 text-sm text-warning">
                  Chỉ tài khoản ứng viên mới có thể tải và chọn CV. Hãy đăng nhập bằng tài khoản demo ứng viên.
                </p>
              ) : (
                <FieldLabel label="CV của bạn">
                  <div className="space-y-3">
                    {loadingProfile ? (
                      <p className="text-sm text-body">Đang tải danh sách CV...</p>
                    ) : (
                      <Select value={cvFileId} onChange={(e) => setCvFileId(e.target.value)}>
                        <option value="">Chọn CV</option>
                        {(profile?.cvFiles ?? []).map((cv) => (
                          <option key={cv.id} value={cv.id}>
                            {cv.fileName}{cv.isPrimary ? " (Mặc định)" : ""}
                          </option>
                        ))}
                      </Select>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-xs text-mute">Hoặc</div>
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border border-ink/10 bg-canvas px-4 py-2 text-body-sm font-semibold transition hover:bg-canvas-soft ${uploadingCv ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <FileText size={16} />
                        {uploadingCv ? "Đang tải lên..." : "Tải lên CV mới"}
                        <input
                          type="file"
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="hidden"
                          onChange={(e) => void handleCvUpload(e)}
                          disabled={uploadingCv}
                        />
                      </label>
                    </div>

                    <p className="text-xs text-mute">Hỗ trợ PDF, DOCX (tối đa 5MB). AI sẽ đọc nội dung file để chấm điểm.</p>
                  </div>
                </FieldLabel>
              )}

              {error ? (
                <p className="rounded-lg border border-hairline-strong bg-accent-red-glow p-3 text-sm text-negative">{error}</p>
              ) : null}

              {isCandidate && token ? (
                <Button
                  variant="primary"
                  className="w-full"
                  isLoading={screening}
                  leftIcon={<Sparkles size={16} />}
                  onClick={() => void runScreening()}
                  disabled={!cvFileId}
                >
                  Chấm điểm với AI
                </Button>
              ) : null}

              {report ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-4 rounded-xl border border-ink/10 bg-canvas-soft p-4">
                    <div className="relative h-28 w-28 shrink-0">
                      <svg className="h-28 w-28 -rotate-90">
                        <circle cx="56" cy="56" r="52" strokeWidth="9" className="stroke-ink/10 fill-none" />
                        <motion.circle
                          cx="56"
                          cy="56"
                          r="52"
                          strokeWidth="9"
                          className={`fill-none ${tone?.ring ?? ""}`}
                          strokeDasharray={circumference}
                          strokeLinecap="round"
                          initial={{ strokeDashoffset: circumference }}
                          animate={{ strokeDashoffset: circumference - (circumference * report.score) / 100 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-black ${tone?.text ?? "text-ink"}`}>
                          <CountUp to={report.score} />
                        </span>
                        <span className="text-[10px] font-semibold text-body">/100</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-body">Kết luận</p>
                      <span className={`mt-1 inline-block rounded-pill px-3 py-1 text-sm font-bold ${tone?.badge ?? ""}`}>
                        {report.verdict}
                      </span>
                    </div>
                  </div>

                  {report.strengths.length ? (
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-positive"><CheckCircle2 size={16} /> Điểm mạnh</p>
                      <ul className="space-y-1.5 text-sm text-ink">
                        {report.strengths.map((item) => (
                          <li key={item} className="flex gap-2"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-positive" /><span>{item}</span></li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {report.gaps.length ? (
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning"><AlertTriangle size={16} /> Điểm cần cải thiện</p>
                      <ul className="space-y-1.5 text-sm text-ink">
                        {report.gaps.map((item) => (
                          <li key={item} className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" /><span>{item}</span></li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {report.keywords_matched.map((kw) => (
                      <span key={`m-${kw}`} className="rounded-full bg-accent-green-glow px-3 py-1 text-xs font-semibold text-positive">{kw}</span>
                    ))}
                    {report.keywords_missing.map((kw) => (
                      <span key={`x-${kw}`} className="rounded-full bg-accent-red-glow px-3 py-1 text-xs font-semibold text-negative">{kw}</span>
                    ))}
                  </div>

                  {report.suggestion ? (
                    <p className="rounded-lg border border-ink/10 bg-canvas p-3 text-sm text-body">{report.suggestion}</p>
                  ) : null}
                </motion.div>
              ) : null}
            </div>

            <div className="border-t border-ink/10 p-5">
              <a href={job.url} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" className="w-full" leftIcon={<ExternalLink size={16} />}>
                  Ứng tuyển trên {sourceMeta(job.source).label}
                </Button>
              </a>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
