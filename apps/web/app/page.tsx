"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles,
  ArrowRight,
  Briefcase,
  FileCheck2,
  Users2,
  Layers,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Clock,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { dashboardHref, dashboardLabel } from "../lib/dashboard-routes";
import { LoaderOverlay } from "../components/ui/loader";
import { Button } from "../components/ui/button";
import { HeroQuickSearch } from "../components/home/hero-quick-search";
import { AiScreeningMockup } from "../components/home/ai-screening-mockup";
import { DualJourneySection } from "../components/home/dual-journey-section";
import { FaqAccordion } from "../components/home/faq-accordion";

const DEMO_EMAIL = "linh.nguyen@example.com";

function formatDemoError(error: string) {
  if (error === "Failed to fetch" || error === "Network error") {
    return "Không kết nối được API. Kiểm tra API đang chạy (port 4000).";
  }
  return error;
}

export default function HomePage() {
  const { demoLogin, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleDemo() {
    setDemoLoading(true);
    const err = await demoLogin(DEMO_EMAIL);
    setDemoLoading(false);
    if (err) {
      toast.error(formatDemoError(err));
      return;
    }
    toast.success("Đăng nhập tài khoản demo thành công!");
    router.push(dashboardHref("CANDIDATE"));
  }

  const destination = dashboardHref(user?.role);

  return (
    <div className="min-h-screen w-full bg-canvas font-marketing text-ink selection:bg-primary/20 selection:text-ink">
      <LoaderOverlay show={demoLoading} label="Đang đăng nhập demo..." />

      {/* ─────────────────────────────────────────────────────────────────────────
          1. HERO SECTION
          ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36">
        {/* Glow Effects */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[700px] w-full max-w-[1200px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top_center,var(--colors-accent-green-glow),transparent_65%)] opacity-80" />
        <div className="pointer-events-none absolute left-1/4 top-1/4 -z-10 h-[500px] w-[500px] rounded-full bg-primary/15 blur-3xl opacity-50" />

        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          {/* Top pill badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-pale/70 px-4 py-1.5 text-caption font-bold text-positive-deep shadow-xs backdrop-blur-md mb-6"
          >
            <Sparkles size={14} className="text-primary animate-pulse" />
            <span>Nền tảng Tuyển dụng AI-First · Tự động tổng hợp 780+ việc làm IT</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-[42px] leading-[1.05] tracking-tight text-ink sm:text-[68px] md:text-[84px] font-black"
          >
            Tuyển dụng thông minh.
            <br />
            <span className="bg-gradient-to-r from-ink via-positive-deep to-primary bg-clip-text text-transparent">
              Đột phá cùng AI.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-6 max-w-3xl text-body-lg text-body leading-relaxed"
          >
            Nền tảng kết nối ứng viên và nhà tuyển dụng thế hệ mới. Tự động thu thập hàng trăm việc làm công nghệ từ{" "}
            <strong>ITviec, CareerViet, TopCV, VietnamWorks</strong> — phân tích mức độ phù hợp của CV với AI trước khi ứng tuyển.
          </motion.p>

          {/* Hero Quick Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-10 w-full flex justify-center"
          >
            <HeroQuickSearch />
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3.5"
          >
            <Link href="/external-jobs">
              <Button
                variant="primary"
                className="h-12 px-7 rounded-xl font-bold shadow-md"
                rightIcon={<ArrowRight size={17} />}
              >
                Khám phá 780+ việc làm
              </Button>
            </Link>

            {!authLoading && !user ? (
              <button
                type="button"
                disabled={demoLoading}
                onClick={handleDemo}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-hairline-strong bg-surface-elevated/90 px-6 text-body-sm font-bold text-ink transition hover:border-hairline hover:bg-surface-card disabled:opacity-60 shadow-xs"
              >
                <Sparkles size={16} className="text-primary" />
                <span>{demoLoading ? "Đang đăng nhập..." : "Trải nghiệm Demo 1-click"}</span>
              </button>
            ) : !authLoading && user ? (
              <Link href={destination}>
                <button
                  type="button"
                  className="flex h-12 items-center justify-center rounded-xl border border-hairline-strong bg-surface-elevated px-6 text-body-sm font-bold text-ink transition hover:bg-surface-card"
                >
                  {dashboardLabel(user.role)}
                </button>
              </Link>
            ) : null}
          </motion.div>
        </div>

        {/* Interactive Mockup Component */}
        <div className="mt-16 sm:mt-20">
          <AiScreeningMockup />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          2. MULTI-SOURCE SOCIAL PROOF STRIP
          ───────────────────────────────────────────────────────────────────────── */}
      <section className="border-y border-hairline-strong bg-surface-card/40 py-10 px-4 sm:px-6">
        <div className="mx-auto max-w-container text-center">
          <p className="text-caption font-bold uppercase tracking-widest text-mute mb-6">
            Dữ liệu tổng hợp thời gian thực từ các cổng việc làm hàng đầu Việt Nam
          </p>

          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
            <div className="flex items-center gap-2 rounded-xl border border-red-200/80 bg-red-50/70 px-4 py-2 text-red-600 font-extrabold text-sm dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/50">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              ITviec (260+ Việc làm)
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-indigo-200/80 bg-indigo-50/70 px-4 py-2 text-indigo-600 font-extrabold text-sm dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/50">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              CareerViet (470+ Việc làm)
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-2 text-emerald-700 font-extrabold text-sm dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/50">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              TopCV Tuyển dụng
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/70 px-4 py-2 text-blue-700 font-extrabold text-sm dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              VietnamWorks
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. IMPACT STATS SECTION
          ───────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-container">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "780+",
                label: "Việc làm công nghệ",
                desc: "Được làm mới tự động mỗi 30 phút",
                icon: Briefcase
              },
              {
                number: "4 Nguồn",
                label: "Cổng tuyển dụng tích hợp",
                desc: "ITviec, CareerViet, TopCV, VietnamWorks",
                icon: Layers
              },
              {
                number: "95%",
                label: "Độ chính xác AI ATS",
                desc: "Phân tích kỹ năng và độ phù hợp JD",
                icon: Cpu
              },
              {
                number: "70%",
                label: "Tiết kiệm thời gian tuyển",
                desc: "Tự động hóa phân loại và lọc hồ sơ HR",
                icon: Clock
              }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-2xl border border-hairline-strong bg-surface-card p-6 transition-all hover:border-hairline hover:shadow-lg"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-3xl font-black text-ink tracking-tight sm:text-4xl">
                      {stat.number}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-pale text-positive-deep">
                      <Icon size={20} />
                    </div>
                  </div>
                  <h3 className="text-body-sm font-bold text-ink">{stat.label}</h3>
                  <p className="mt-1 text-caption text-mute">{stat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. CORE ECOSYSTEM FEATURES
          ───────────────────────────────────────────────────────────────────────── */}
      <section className="border-t border-hairline-strong bg-canvas py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-container">
          <div className="text-center mb-16">
            <span className="rounded-pill bg-primary/15 px-3 py-1 text-caption font-bold text-positive-deep uppercase tracking-wider">
              Hệ Sinh Thái Toàn Diện
            </span>
            <h2 className="mt-4 font-display text-[36px] font-black text-ink sm:text-[48px] leading-tight">
              Công nghệ AI thúc đẩy sự nghiệp của bạn
            </h2>
            <p className="mt-3 text-body-md text-body max-w-2xl mx-auto">
              Từ chấm điểm độ phù hợp CV, gom tin tuyển dụng đa nguồn đến công cụ tạo CV và mạng xã hội chuyên môn.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sparkles,
                title: "AI Chấm Điểm CV (Screening)",
                desc: "Phân tích mức độ tương thích giữa hồ sơ và JD, chỉ ra các kỹ năng còn thiếu và dự đoán khả năng trúng tuyển.",
                badge: "AI-Powered",
                color: "text-positive-deep bg-primary-pale"
              },
              {
                icon: Layers,
                title: "Thu Thập Đa Nguồn (Aggregator)",
                desc: "Hệ thống crawler chạy song song 4 cổng tuyển dụng IT lớn nhất, tự động làm sạch và loại bỏ tin tuyển dụng trùng lặp.",
                badge: "Tự động 100%",
                color: "text-link bg-accent-blue-glow"
              },
              {
                icon: FileCheck2,
                title: "Tạo CV Chuẩn ATS",
                desc: "Thiết kế CV chuyên nghiệp, xuất file PDF đạt chuẩn quốc tế, tự động đề xuất từ khóa công nghệ tối ưu hóa tìm kiếm.",
                badge: "Chuẩn Quốc Tế",
                color: "text-positive bg-accent-green-glow"
              },
              {
                icon: Users2,
                title: "Mạng Lưới & Bảng Tin IT",
                desc: "Không chỉ tìm việc, bạn có thể chia sẻ bài viết, mở rộng quan hệ với các kỹ sư tài năng và các Tech Leaders.",
                badge: "Cộng Đồng",
                color: "text-warning bg-accent-yellow-glow"
              }
            ].map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="group flex flex-col justify-between rounded-2xl border border-hairline-strong bg-surface-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-hairline hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                        <Icon size={24} />
                      </div>
                      <span className="rounded-full border border-hairline-strong bg-surface-elevated px-2.5 py-0.5 text-[11px] font-bold text-mute">
                        {f.badge}
                      </span>
                    </div>
                    <h3 className="text-body-md font-bold text-ink group-hover:text-primary transition-colors">
                      {f.title}
                    </h3>
                    <p className="mt-2.5 text-body-sm text-body leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          5. DUAL JOURNEY SECTION (CANDIDATE VS RECRUITER)
          ───────────────────────────────────────────────────────────────────────── */}
      <section className="border-t border-hairline-strong bg-surface-card/30 py-24 px-4 sm:px-6">
        <DualJourneySection />
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          6. HOW IT WORKS (3 SIMPLE STEPS)
          ───────────────────────────────────────────────────────────────────────── */}
      <section className="border-t border-hairline-strong bg-canvas py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-container">
          <div className="text-center mb-16">
            <span className="rounded-pill bg-primary/15 px-3 py-1 text-caption font-bold text-positive-deep uppercase tracking-wider">
              Quy Trình Hoạt Động
            </span>
            <h2 className="mt-4 font-display text-[36px] font-black text-ink sm:text-[48px] leading-tight">
              3 bước đơn giản để bứt phá sự nghiệp
            </h2>
            <p className="mt-3 text-body-md text-body max-w-2xl mx-auto">
              Không còn nộp hồ sơ mù quáng. Hãy để AI đồng hành và định vị giá trị của bạn.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Tạo hoặc Tải lên CV",
                desc: "Đăng tải CV có sẵn (PDF, DOCX) hoặc thiết kế bản CV chuẩn ATS chỉ trong vài phút với công cụ AI CV Builder."
              },
              {
                step: "02",
                title: "AI Phân Tích & Đề Xuất",
                desc: "Hệ thống tự động so sánh kỹ năng của bạn với hơn 780+ việc làm IT được cào từ 4 nguồn, hiển thị điểm số Match Score."
              },
              {
                step: "03",
                title: "Ứng Tuyển & Phỏng Vấn",
                desc: "Nhận lời khuyên phỏng vấn từ AI, nộp hồ sơ tự tin và kết nối trực tiếp với nhà tuyển dụng để nhận offer mong ước."
              }
            ].map((step, i) => (
              <div
                key={i}
                className="relative flex flex-col rounded-2xl border border-hairline-strong bg-surface-card p-8 transition-all hover:border-hairline"
              >
                <span className="font-mono text-4xl font-black text-primary/40 mb-4">{step.step}</span>
                <h3 className="text-body-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-3 text-body-sm text-body leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          7. FAQ SECTION
          ───────────────────────────────────────────────────────────────────────── */}
      <section className="border-t border-hairline-strong bg-surface-card/30 py-24 px-4 sm:px-6">
        <FaqAccordion />
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          8. CALL TO ACTION BANNER
          ───────────────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-hairline-strong bg-canvas py-20 px-4 sm:px-6">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-full max-w-[900px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle_at_center,var(--colors-accent-green-glow),transparent_70%)] opacity-80" />

        <div className="mx-auto max-w-4xl rounded-3xl border border-hairline-strong bg-gradient-to-br from-surface-card via-surface-elevated to-surface-card p-8 sm:p-12 text-center shadow-2xl">
          <span className="rounded-pill bg-primary/20 px-3 py-1 text-caption font-bold text-positive-deep uppercase tracking-wider">
            Bắt Đầu Ngay Hôm Nay
          </span>
          <h2 className="mt-4 font-display text-[36px] font-black text-ink sm:text-[48px] leading-tight">
            Sẵn sàng nâng tầm tuyển dụng với AI?
          </h2>
          <p className="mt-4 text-body-md text-body max-w-2xl mx-auto">
            Khám phá ngay hơn 780+ cơ hội việc làm IT từ ITviec, CareerViet, TopCV và VietnamWorks. Chấm điểm CV miễn phí trong vòng 3 giây.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/external-jobs">
              <Button variant="primary" className="h-12 px-8 rounded-xl font-bold shadow-md" rightIcon={<ArrowRight size={17} />}>
                Xem 780+ việc làm IT
              </Button>
            </Link>
            {!authLoading && !user && (
              <button
                type="button"
                disabled={demoLoading}
                onClick={handleDemo}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-hairline-strong bg-surface-card px-6 text-body-sm font-bold text-ink transition hover:bg-surface-elevated shadow-xs"
              >
                <Sparkles size={16} className="text-primary" />
                <span>Trải nghiệm Demo 1-click</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
