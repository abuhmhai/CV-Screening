"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { apiFetch } from "../lib/api-client";
import { Job } from "../lib/types";
import { JobCard } from "../components/job-card";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { LoadingBlock } from "../components/ui/states";

function AnimatedNumber({ value, decimals = 0, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => latest.toFixed(decimals) + suffix);

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: "easeOut" });
    }
  }, [isInView, value, count]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
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
      {/* 1. Dark hero background with 5. Subtle grid/dot pattern */}
      <section className="relative overflow-hidden rounded-xl bg-slate-950 text-white lg:grid lg:grid-cols-[1.6fr_1fr] shadow-xl">
        <div 
          className="absolute inset-0 z-0 opacity-30" 
          style={{ backgroundImage: "radial-gradient(circle, #334155 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
        />
        <div className="relative z-10 p-8 lg:p-10 flex flex-col justify-center">
          <p className="inline-flex w-fit rounded-pill bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 text-xs font-semibold text-primary">
            ✨ AI Screening + Professional Network
          </p>
          <h1 className="mt-5 max-w-2xl font-display text-4xl font-black leading-[1.1] text-white sm:text-display-md">
            Tuyển dụng thông minh. <br/><span className="text-primary">Kết nối chuyên nghiệp.</span>
          </h1>
          <p className="mt-5 max-w-xl text-body-md text-slate-300">
            TalentFlow giúp ứng viên xây hồ sơ, ứng tuyển và nhận điểm AI minh bạch — đồng thời
            giúp recruiter shortlist nhanh với pipeline trực quan và thông báo realtime.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link href="/jobs">
              {/* 2. Glowing CTA button */}
              <Button className="shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] border-none">
                Khám phá việc làm
              </Button>
            </Link>
            <Link href="/auth/sign-in">
              <Button className="bg-white/10 text-white hover:bg-white/20 border border-white/10 backdrop-blur-md">
                Đăng nhập demo
              </Button>
            </Link>
          </div>
        </div>
        
        <aside className="relative z-10 flex flex-col justify-center border-l border-white/10 bg-slate-900/50 p-8 lg:p-10 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white/90">Tổng quan realtime</h2>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-lg backdrop-blur-md bg-white/5 border border-white/10 px-4 py-3">
              <span className="text-sm text-slate-300">Việc làm đang mở</span>
              <strong className="text-primary font-black text-lg">
                {loading ? "…" : <AnimatedNumber value={jobs.length} />}
              </strong>
            </div>
            <div className="flex items-center justify-between rounded-lg backdrop-blur-md bg-white/5 border border-white/10 px-4 py-3">
              <span className="text-sm text-slate-300">Tổng đơn ứng tuyển</span>
              <strong className="text-primary font-black text-lg">
                {loading ? "…" : <AnimatedNumber value={totalApplications} />}
              </strong>
            </div>
            <div className="flex items-center justify-between rounded-lg backdrop-blur-md bg-white/5 border border-white/10 px-4 py-3">
              <span className="text-sm text-slate-300">Công ty đối tác</span>
              <strong className="text-white font-black text-lg">
                <AnimatedNumber value={2} />
              </strong>
            </div>
            <div className="flex items-center justify-between rounded-lg backdrop-blur-md bg-white/5 border border-white/10 px-4 py-3">
              <span className="text-sm text-slate-300">Thời gian AI screening</span>
              <strong className="text-white font-black text-lg">
                &lt; <AnimatedNumber value={2} suffix="s" />
              </strong>
            </div>
          </div>
        </aside>
      </section>

      {/* 4. Glassmorphism cards & 3. Animated số realtime for Stat Cards section */}
      <section className="relative overflow-hidden rounded-xl bg-slate-950 p-6 shadow-lg">
        <div 
          className="absolute inset-0 z-0 opacity-20" 
          style={{ backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        />
        <div className="relative z-10 grid gap-4 md:grid-cols-4">
          <article className="rounded-xl backdrop-blur-md bg-white/5 border border-white/10 p-5">
            <p className="text-sm font-semibold text-slate-300">Việc đang mở</p>
            <p className="mt-2 text-3xl font-black text-white">
              {loading ? "…" : <AnimatedNumber value={jobs.length} />}
            </p>
          </article>
          <article className="rounded-xl backdrop-blur-md bg-primary/10 border border-primary/20 p-5">
            <p className="text-sm font-semibold text-primary">Applications</p>
            <p className="mt-2 text-3xl font-black text-white">
              {loading ? "…" : <AnimatedNumber value={totalApplications} />}
            </p>
          </article>
          <article className="rounded-xl backdrop-blur-md bg-white/5 border border-white/10 p-5">
            <p className="text-sm font-semibold text-slate-300">AI Engine</p>
            <p className="mt-2 text-3xl font-black text-white">v1.0</p>
          </article>
          <article className="rounded-xl backdrop-blur-md bg-amber-500/10 border border-amber-500/20 p-5">
            <p className="text-sm font-semibold text-amber-400">Match trung bình</p>
            <p className="mt-2 text-3xl font-black text-white">
              <AnimatedNumber value={78.4} decimals={1} suffix="%" />
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold">Dành cho ứng viên</h2>
          <ul className="mt-4 space-y-3 text-sm text-body">
            {[
              "Hồ sơ LinkedIn-style với kinh nghiệm, học vấn, kỹ năng",
              "Ứng tuyển 1-click với CV đã lưu + AI score breakdown",
              "Feed, kết nối, nhắn tin trực tiếp với recruiter"
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 rounded-lg bg-canvas-soft px-4 py-3">
                <span className="text-primary text-lg">✓</span> {text}
              </li>
            ))}
          </ul>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold">Dành cho recruiter</h2>
          <ul className="mt-4 space-y-3 text-sm text-body">
            {[
              "Dashboard pipeline với lọc theo status & AI score",
              "Chuyển trạng thái ứng viên + thông báo tự động",
              "Đăng tin tuyển dụng có cấu trúc kỹ năng yêu cầu"
            ].map((text) => (
              <li key={text} className="flex items-center gap-3 rounded-lg bg-canvas-soft px-4 py-3">
                <span className="text-primary text-lg">✓</span> {text}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Việc làm nổi bật</h2>
          <Link href="/jobs" className="text-sm font-semibold text-primary hover:text-primary-active transition-colors flex items-center gap-1">
            Xem tất cả <span>→</span>
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
