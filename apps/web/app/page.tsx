"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { apiFetch } from "../lib/api-client";
import { Job } from "../lib/types";
import { JobCard } from "../components/job-card";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { FileUser, Zap, MessageSquare, Briefcase, Filter, Bell, ArrowRight } from "lucide-react";

function AnimatedNumber({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(decimals) + suffix);

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 1.5, ease: "easeOut" });
    }
  }, [isInView, value, count]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {rounded}
    </motion.span>
  );
}

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
      {/* hero-band — DESIGN.md */}
      <section className="hero-band overflow-hidden rounded-xl lg:grid lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col justify-center">
          <p className="inline-flex w-fit rounded-pill bg-canvas px-4 py-1.5 text-body-sm font-semibold text-ink">
            AI Screening + Professional Network
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-display-md font-black leading-tight text-ink sm:text-display-xl">
            Tuyển dụng thông minh.
            <br />
            <span className="text-ink-deep">Kết nối chuyên nghiệp.</span>
          </h1>
          <p className="mt-5 max-w-xl text-body-lg text-body">
            TalentFlow giúp ứng viên xây hồ sơ, ứng tuyển và nhận điểm AI minh bạch — đồng thời giúp
            recruiter shortlist nhanh với pipeline trực quan và thông báo realtime.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link href="/jobs">
              <Button>Khám phá việc làm</Button>
            </Link>
            <Link href="/auth/sign-in">
              <Button variant="tertiary">Đăng nhập demo</Button>
            </Link>
          </div>
        </div>

        <aside className="mt-8 flex flex-col justify-center border-t border-ink/10 pt-8 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <h2 className="text-body-md font-semibold text-ink">Tổng quan realtime</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: "Việc làm đang mở", value: jobs.length, loading },
              { label: "Tổng đơn ứng tuyển", value: totalApplications, loading },
              { label: "Công ty đối tác", value: 2, loading: false },
              { label: "Thời gian AI screening", value: 2, suffix: "s", prefix: "< ", loading: false }
            ].map((stat, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-canvas px-4 py-3 transition hover:translate-x-0.5"
              >
                <span className="text-body-sm text-body">{stat.label}</span>
                <strong className="text-lg font-black text-ink tabular-nums">
                  {stat.loading ? "…" : (
                    <>
                      {stat.prefix}
                      <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                    </>
                  )}
                </strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* Stats — white cards on sage (surface contrast = elevation) */}
      <section className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Việc đang mở", value: jobs.length, loading },
          { label: "Applications", value: totalApplications, loading },
          { label: "AI Engine", value: "v1.0", loading: false, isString: true },
          { label: "Match trung bình", value: 78.4, suffix: "%", decimals: 1, loading: false }
        ].map((stat, i) => (
          <Card key={i} variant="content" className="text-center">
            <p className="text-body-sm font-semibold text-body">{stat.label}</p>
            <p className="mt-2 text-3xl font-black text-ink tabular-nums">
              {stat.loading ? "…" : stat.isString ? stat.value : <AnimatedNumber value={stat.value as number} decimals={stat.decimals} suffix={stat.suffix} />}
            </p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card variant="sage">
          <h2 className="text-xl font-semibold text-ink">Dành cho ứng viên</h2>
          <ul className="mt-4 space-y-3">
            {[
              { icon: <FileUser size={20} />, text: "Hồ sơ LinkedIn-style với kinh nghiệm, học vấn, kỹ năng" },
              { icon: <Zap size={20} />, text: "Ứng tuyển 1-click với CV đã lưu + AI score breakdown" },
              { icon: <MessageSquare size={20} />, text: "Feed, kết nối, nhắn tin trực tiếp với recruiter" }
            ].map((feature, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl bg-canvas px-4 py-3 transition hover:translate-x-1"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-pale text-ink-deep">
                  {feature.icon}
                </span>
                <span className="text-body-sm font-medium text-ink">{feature.text}</span>
              </li>
            ))}
          </ul>
        </Card>
        <Card variant="green">
          <h2 className="text-xl font-semibold text-ink">Dành cho recruiter</h2>
          <ul className="mt-4 space-y-3">
            {[
              { icon: <Filter size={20} />, text: "Dashboard pipeline với lọc theo status & AI score" },
              { icon: <Bell size={20} />, text: "Chuyển trạng thái ứng viên + thông báo tự động" },
              { icon: <Briefcase size={20} />, text: "Đăng tin tuyển dụng có cấu trúc kỹ năng yêu cầu" }
            ].map((feature, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl bg-canvas px-4 py-3 transition hover:translate-x-1"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-ink">
                  {feature.icon}
                </span>
                <span className="text-body-sm font-medium text-ink">{feature.text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-black text-ink">Việc làm nổi bật</h2>
          <Link
            href="/jobs"
            className="group flex items-center gap-1 text-body-sm font-semibold text-ink hover:text-ink-deep"
          >
            Xem tất cả
            <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
          </Link>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-40 w-full" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 stagger-children">
            {jobs.slice(0, 4).map((job) => (
              <div key={job.id} className="animate-fade-up">
                <JobCard job={job} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
