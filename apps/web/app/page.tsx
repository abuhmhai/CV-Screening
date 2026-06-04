"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "../lib/auth-context";
import { Button } from "../components/ui/button";

export default function HomePage() {
  const { demoLogin, user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-canvas text-ink font-marketing selection:bg-hairline-strong selection:text-ink">
      
      {/* Hero Stripe */}
      <div className="relative flex flex-col items-center justify-center px-4 pt-[160px] pb-[96px] sm:px-6 sm:pt-[200px] sm:pb-[128px] text-center">
        {/* Glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-full max-w-[1000px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top_center,var(--colors-accent-blue-glow),transparent_60%)] opacity-80" />

        <div className="stagger-children flex flex-col items-center">
          <h1 className="font-display text-[44px] leading-[1.0] tracking-tight text-ink sm:text-[76.8px] md:text-[96px] animate-fade-up">
            Tuyển dụng thông minh.
          </h1>
          <h1 className="font-display text-[44px] leading-[1.0] tracking-tight text-ink sm:text-[76.8px] md:text-[96px] animate-fade-up">
            Kết nối chuyên nghiệp.
          </h1>
          
          <p className="mt-8 max-w-[600px] text-body-lg text-body animate-fade-up">
            Nền tảng tuyển dụng AI-first kết hợp mạng xã hội nghề nghiệp. Khám phá công việc phù hợp với định hướng phát triển của bạn thông qua đánh giá đa chiều.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 animate-fade-up">
            <Link href="/jobs">
              <button className="flex h-[36px] items-center justify-center rounded-md bg-primary px-6 text-button-md text-primary-on transition hover:bg-surface-light active:bg-surface-light/90">
                Khám phá việc làm
              </button>
            </Link>
            {!user ? (
              <button 
                onClick={() => demoLogin("linh.nguyen@example.com")}
                className="flex h-[36px] items-center justify-center rounded-md border border-hairline-strong bg-surface-elevated px-6 text-button-md text-ink transition hover:bg-surface-card"
              >
                Trải nghiệm Demo
              </button>
            ) : (
              <Link href="/recruiter/dashboard">
                <button className="flex h-[36px] items-center justify-center rounded-md border border-hairline-strong bg-surface-elevated px-6 text-button-md text-ink transition hover:bg-surface-card">
                  Vào Dashboard
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Feature Grid Section */}
      <div className="relative border-t border-hairline-strong bg-canvas px-4 py-[96px] sm:px-6">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-full max-w-[1000px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top_center,var(--colors-accent-green-glow),transparent_60%)] opacity-80" />

        <div className="mx-auto max-w-container">
          <div className="mb-16 text-center animate-fade-up">
            <h2 className="font-display text-[40px] leading-[1.0] text-ink sm:text-[56px] tracking-tight">
              Tuyển dụng thế hệ mới
            </h2>
            <p className="mt-4 text-body-lg text-body">
              Công nghệ phân tích chuyên sâu cho ứng viên và nhà tuyển dụng.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Phân tích hồ sơ AI",
                desc: "Đánh giá mức độ phù hợp kỹ năng, kinh nghiệm với yêu cầu công việc tự động.",
              },
              {
                title: "Trải nghiệm cá nhân hoá",
                desc: "Gợi ý lộ trình phát triển và việc làm phù hợp với mục tiêu dài hạn của bạn.",
              },
              {
                title: "Tự động hoá HR",
                desc: "Quản lý luồng tuyển dụng với thông báo theo thời gian thực và tự động xếp loại.",
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                whileHover={{ y: -4, borderColor: "var(--colors-hairline)" }}
                className="flex flex-col rounded-lg border border-hairline-strong bg-surface-card p-[32px] transition-colors"
              >
                <h3 className="text-heading-md text-ink">{feature.title}</h3>
                <p className="mt-4 text-body-md text-body leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Code Window / Developer Section */}
      <div className="border-t border-hairline-strong bg-canvas px-4 py-[128px] sm:px-6">
        <div className="mx-auto max-w-container">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="animate-fade-up">
              <h2 className="font-display text-[40px] leading-[1.0] text-ink sm:text-[56px] tracking-tight">
                Tích hợp ngay lập tức
              </h2>
              <p className="mt-6 text-body-lg text-body">
                Dễ dàng kết nối qua nền tảng tuyển dụng hiện tại của bạn. Khám phá các công việc được thu thập theo thời gian thực.
              </p>
              <div className="mt-8">
                <Link href="/external-jobs">
                  <button className="flex h-[36px] items-center justify-center rounded-md border border-hairline-strong bg-surface-elevated px-6 text-button-md text-ink transition hover:bg-surface-card">
                    Xem Việc làm tổng hợp
                  </button>
                </Link>
              </div>
            </div>

            {/* Code Window Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="rounded-lg border border-hairline-strong bg-surface-deep p-[24px] shadow-2xl"
            >
              <div className="mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-accent-red" />
                <div className="h-2 w-2 rounded-full bg-accent-yellow" />
                <div className="h-2 w-2 rounded-full bg-accent-green" />
              </div>
              <pre className="font-mono text-code-md text-body overflow-x-auto">
                <code>
<span className="text-accent-blue">import</span> {'{'} <span className="text-accent-green">JobCrawler</span> {'}'} <span className="text-accent-blue">from</span> <span className="text-accent-yellow">'@talentflow/crawler'</span>;{'\n\n'}
<span className="text-accent-blue">const</span> crawler = <span className="text-accent-blue">new</span> JobCrawler({'{'}{'\n'}
{'  '}providers: [<span className="text-accent-yellow">'topcv'</span>, <span className="text-accent-yellow">'vietnamworks'</span>],{'\n'}
{'  '}syncInterval: <span className="text-accent-orange">3600</span>,{'\n'}
{'}'});{'\n\n'}
crawler.<span className="text-accent-blue">on</span>(<span className="text-accent-yellow">'job_matched'</span>, (job) {'=>'} {'{'}{'\n'}
{'  '}<span className="text-mute">// Đề xuất công việc tới ứng viên tiềm năng</span>{'\n'}
{'  '}notifyCandidates(job);{'\n'}
{'}'});
                </code>
              </pre>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
