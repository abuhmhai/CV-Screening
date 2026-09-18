"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, AlertCircle, Building2, MapPin, Wallet, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function AiScreeningMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative mx-auto w-full max-w-4xl overflow-hidden rounded-3xl border border-hairline-strong bg-surface-card/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl"
    >
      {/* Glow behind card */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent-green-glow blur-3xl" />

      {/* Header bar of mockup */}
      <div className="relative flex flex-wrap items-center justify-between gap-4 border-b border-hairline pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-positive-deep">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-body-sm font-bold text-ink">Mô Phỏng AI Match Score</span>
              <span className="flex items-center gap-1 rounded-pill bg-positive/15 px-2 py-0.5 text-[10px] font-bold text-positive">
                <span className="h-1.5 w-1.5 rounded-full bg-positive animate-ping" />
                Live Analysis
              </span>
            </div>
            <p className="text-caption text-mute">Đánh giá độ tương thích giữa CV ứng viên và mô tả công việc (JD)</p>
          </div>
        </div>

        <Link
          href="/external-jobs"
          className="flex items-center gap-1 text-caption font-semibold text-primary hover:underline"
        >
          <span>Xem phân tích thực tế</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Body: 2 Columns */}
      <div className="relative mt-6 grid gap-6 lg:grid-cols-12 lg:items-center">
        {/* Left Column: Job detail card */}
        <div className="lg:col-span-7 space-y-4 rounded-2xl border border-hairline bg-surface-elevated/70 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-pill bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 text-[10px] font-bold dark:bg-red-950/50 dark:text-red-400">
                  ITviec
                </span>
                <span className="text-caption text-mute">Đăng 2 giờ trước</span>
              </div>
              <h4 className="mt-1.5 text-body-md font-bold text-ink">
                Senior Fullstack Engineer (ReactJS / NodeJS / AI)
              </h4>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-body">
                <span className="flex items-center gap-1 font-medium text-ink">
                  <Building2 size={13} className="text-mute" /> VNG Corporation
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} className="text-mute" /> TP. Hồ Chí Minh
                </span>
                <span className="flex items-center gap-1 font-semibold text-positive-deep">
                  <Wallet size={13} className="text-positive" /> 45 - 65 Triệu VND
                </span>
              </div>
            </div>
          </div>

          {/* Skill tags breakdown */}
          <div className="space-y-2 border-t border-hairline pt-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mute">
              Phân tích kỹ năng yêu cầu:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: "ReactJS", matched: true },
                { name: "NodeJS", matched: true },
                { name: "TypeScript", matched: true },
                { name: "NextJS", matched: true },
                { name: "PostgreSQL", matched: true },
                { name: "REST API", matched: true },
                { name: "Docker", matched: false },
                { name: "AWS Cloud", matched: false }
              ].map((s) => (
                <span
                  key={s.name}
                  className={`inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold ${
                    s.matched
                      ? "border border-positive/30 bg-accent-green-glow text-positive-deep"
                      : "border border-warning/30 bg-accent-yellow-glow text-warning"
                  }`}
                >
                  {s.matched ? <Check size={12} className="text-positive" /> : <AlertCircle size={12} />}
                  <span>{s.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Score & Verdict */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-hairline bg-surface-elevated/70 p-6 text-center">
          {/* Circular score gauge */}
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-surface-card"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray="264"
                strokeDashoffset="18"
                strokeLinecap="round"
                className="text-positive transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-black text-ink">94%</span>
              <span className="text-[10px] font-bold uppercase text-positive">Rất phù hợp</span>
            </div>
          </div>

          {/* Key metrics */}
          <div className="mt-4 w-full space-y-1.5 text-left text-caption border-t border-hairline pt-3">
            <div className="flex justify-between">
              <span className="text-mute">Kỹ năng chuyên môn:</span>
              <span className="font-bold text-positive">Khớp 6/8 kỹ năng</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mute">Kinh nghiệm làm việc:</span>
              <span className="font-bold text-ink">4+ năm (Yêu cầu 3+ năm)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-mute">Xếp hạng ứng viên:</span>
              <span className="font-bold text-positive-deep">Top 5% hồ sơ</span>
            </div>
          </div>

          {/* AI advice quote */}
          <div className="mt-3.5 w-full rounded-xl bg-primary-pale/50 p-2.5 text-left text-[11px] text-positive-deep">
            💡 <strong>Lời khuyên AI:</strong> Nhấn mạnh kinh nghiệm tối ưu hiệu năng React và REST API trong phần phỏng vấn để tăng 30% cơ hội trúng tuyển.
          </div>
        </div>
      </div>
    </motion.div>
  );
}
