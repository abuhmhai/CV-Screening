"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../lib/api-client";
import { Job } from "../lib/types";
import { StatCard } from "../components/stat-card";
import { JobCard } from "../components/job-card";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LoadingBlock } from "../components/ui/states";

export default function HomePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void apiFetch<Job[]>("/jobs").then((res) => {
      if (res.ok && res.data) setJobs(res.data.filter((j) => j.status === "ACTIVE"));
      setLoading(false);
    });
  }, []);

  const totalApplications = jobs.reduce((sum, j) => sum + (j._count?.applications ?? 0), 0);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-xl bg-canvas lg:grid lg:grid-cols-[1.6fr_1fr]">
        <div className="p-8 lg:p-10">
          <p className="inline-flex rounded-pill bg-primary-pale px-4 py-1 text-xs font-semibold text-ink-deep">
            AI Screening + Professional Network
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-black leading-[0.95] text-ink sm:text-display-md">
            Tuyển dụng thông minh. Kết nối chuyên nghiệp.
          </h1>
          <p className="mt-4 max-w-2xl text-body-md text-body">
            TalentFlow giúp ứng viên xây hồ sơ, ứng tuyển và nhận điểm AI minh bạch — đồng thời
            giúp recruiter shortlist nhanh với pipeline trực quan và thông báo realtime.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href="/jobs">
              <Button>Khám phá việc làm</Button>
            </Link>
            <Link href="/auth/sign-in">
              <Button variant="tertiary">Đăng nhập demo</Button>
            </Link>
            <Link href="/recruiter/dashboard">
              <Button variant="secondary">Recruiter Dashboard</Button>
            </Link>
          </div>
        </div>
        <aside className="bg-ink p-8 text-white lg:p-10">
          <h2 className="text-lg font-semibold">Tổng quan realtime</h2>
          <div className="mt-6 space-y-3">
            {[
              { label: "Việc làm đang mở", value: loading ? "…" : String(jobs.length) },
              { label: "Tổng đơn ứng tuyển", value: loading ? "…" : String(totalApplications) },
              { label: "Công ty đối tác", value: "2" },
              { label: "Thời gian AI screening", value: "< 2s" }
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3"
              >
                <span className="text-sm text-white/80">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Việc đang mở" value={loading ? "…" : String(jobs.length)} />
        <StatCard label="Applications" value={loading ? "…" : String(totalApplications)} tone="positive" />
        <StatCard label="AI Engine" value="v1.0" />
        <StatCard label="Match trung bình" value="78.4" tone="warning" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-semibold">Dành cho ứng viên</h2>
          <ul className="mt-4 space-y-3 text-sm text-body">
            {[
              "Hồ sơ LinkedIn-style với kinh nghiệm, học vấn, kỹ năng",
              "Ứng tuyển 1-click với CV đã lưu + AI score breakdown",
              "Feed, kết nối, nhắn tin trực tiếp với recruiter"
            ].map((text) => (
              <li key={text} className="rounded-lg bg-canvas-soft px-4 py-3">
                {text}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-xl font-semibold">Dành cho recruiter</h2>
          <ul className="mt-4 space-y-3 text-sm text-body">
            {[
              "Dashboard pipeline với lọc theo status & AI score",
              "Chuyển trạng thái ứng viên + thông báo tự động",
              "Đăng tin tuyển dụng có cấu trúc kỹ năng yêu cầu"
            ].map((text) => (
              <li key={text} className="rounded-lg bg-canvas-soft px-4 py-3">
                {text}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Việc làm nổi bật</h2>
          <Link href="/jobs" className="text-sm font-semibold text-ink-deep hover:underline">
            Xem tất cả →
          </Link>
        </div>
        {loading ? (
          <LoadingBlock />
        ) : (
          jobs.slice(0, 4).map((job) => <JobCard key={job.id} job={job} />)
        )}
      </section>
    </div>
  );
}
