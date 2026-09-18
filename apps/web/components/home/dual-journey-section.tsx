"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe2,
  Sparkles,
  FileText,
  Users,
  LayoutDashboard,
  Filter,
  BarChart3,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

const CANDIDATE_PERKS = [
  {
    icon: Globe2,
    title: "Kho việc làm IT đồ sộ",
    desc: "Tổng hợp hơn 780+ vị trí công nghệ từ ITviec, CareerViet, TopCV, VietnamWorks được làm mới liên tục."
  },
  {
    icon: Sparkles,
    title: "Chấm điểm CV với AI",
    desc: "Đo lường độ khớp kỹ năng với mô tả công việc (JD) trước khi nộp, nhận gợi ý tối ưu CV để đạt tỉ lệ gọi phỏng vấn cao nhất."
  },
  {
    icon: FileText,
    title: "Tạo CV chuyên nghiệp chuẩn ATS",
    desc: "Bộ công cụ soạn thảo CV thông minh, tự động gợi ý từ khóa công nghệ và xuất file chuẩn format quốc tế."
  },
  {
    icon: Users,
    title: "Mạng lưới nghề nghiệp mở",
    desc: "Bảng tin công nghệ và kết nối trực tiếp với các chuyên gia, Tech Leads và nhà tuyển dụng đầu ngành."
  }
];

const RECRUITER_PERKS = [
  {
    icon: Filter,
    title: "Tự động lọc & Xếp hạng ứng viên",
    desc: "AI tự động phân tích hàng trăm hồ sơ CV, so khớp với tiêu chí tuyển dụng và chấm điểm tương thích trong vài giây."
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard quản lý tuyển dụng",
    desc: "Theo dõi toàn diện quy trình ứng tuyển từ Nộp đơn -> Phỏng vấn -> Gửi Offer trên một bảng Kanban trực quan."
  },
  {
    icon: BarChart3,
    title: "Thống kê & Báo cáo thời gian thực",
    desc: "Đo lường hiệu quả nguồn ứng viên, tốc độ tuyển dụng và phân tích kỹ năng còn thiếu của các đợt tuyển."
  },
  {
    icon: Users,
    title: "Tiếp cận nhân tài chất lượng cao",
    desc: "Hồ sơ ứng viên được xác thực trình độ, kỹ năng thực tế và sẵn sàng phỏng vấn nhanh chóng."
  }
];

export function DualJourneySection() {
  const [activeTab, setActiveTab] = useState<"candidate" | "recruiter">("candidate");

  return (
    <div className="mx-auto max-w-container">
      {/* Section Header */}
      <div className="text-center mb-12">
        <span className="rounded-pill bg-primary/15 px-3 py-1 text-caption font-bold text-positive-deep uppercase tracking-wider">
          Giải Pháp Cho Mọi Đối Tượng
        </span>
        <h2 className="mt-4 font-display text-[36px] leading-tight font-black text-ink sm:text-[48px]">
          Thiết kế tối ưu cho cả Ứng viên & Nhà tuyển dụng
        </h2>
        <p className="mt-3 text-body-md text-body max-w-2xl mx-auto">
          Dù bạn đang tìm kiếm bước ngoặt sự nghiệp hay săn đón những kỹ sư tài năng, TalentFlow đều trang bị công nghệ AI mạnh mẽ nhất.
        </p>

        {/* Tab Switcher */}
        <div className="mt-8 inline-flex rounded-2xl border border-hairline-strong bg-surface-card p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab("candidate")}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-body-sm font-bold transition-all ${
              activeTab === "candidate"
                ? "bg-primary text-ink shadow-sm"
                : "text-body hover:text-ink hover:bg-surface-elevated"
            }`}
          >
            <span>Dành cho Ứng viên</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("recruiter")}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-body-sm font-bold transition-all ${
              activeTab === "recruiter"
                ? "bg-primary text-ink shadow-sm"
                : "text-body hover:text-ink hover:bg-surface-elevated"
            }`}
          >
            <span>Dành cho Nhà tuyển dụng</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <AnimatePresence mode="wait">
        {activeTab === "candidate" ? (
          <motion.div
            key="candidate"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {CANDIDATE_PERKS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-2xl border border-hairline-strong bg-surface-card p-6 transition-all hover:-translate-y-1 hover:border-hairline hover:shadow-lg"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-pale text-positive-deep mb-5">
                      <Icon size={24} />
                    </div>
                    <h3 className="text-body-md font-bold text-ink">{item.title}</h3>
                    <p className="mt-2.5 text-body-sm text-body leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-hairline">
                    <span className="flex items-center gap-1.5 text-caption font-semibold text-positive-deep">
                      <CheckCircle2 size={14} className="text-positive" />
                      Miễn phí 100%
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="recruiter"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {RECRUITER_PERKS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-2xl border border-hairline-strong bg-surface-card p-6 transition-all hover:-translate-y-1 hover:border-hairline hover:shadow-lg"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue-glow text-link mb-5">
                      <Icon size={24} />
                    </div>
                    <h3 className="text-body-md font-bold text-ink">{item.title}</h3>
                    <p className="mt-2.5 text-body-sm text-body leading-relaxed">{item.desc}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-hairline">
                    <span className="flex items-center gap-1.5 text-caption font-semibold text-link">
                      <CheckCircle2 size={14} className="text-link" />
                      Tối ưu quy trình HR
                    </span>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab CTA link */}
      <div className="mt-10 text-center">
        {activeTab === "candidate" ? (
          <Link href="/external-jobs">
            <Button variant="primary" className="h-12 px-7 rounded-xl font-bold shadow-sm" rightIcon={<ArrowRight size={17} />}>
              Khám phá ngay 780+ việc làm IT
            </Button>
          </Link>
        ) : (
          <Link href="/recruiter/dashboard">
            <Button variant="primary" className="h-12 px-7 rounded-xl font-bold shadow-sm" rightIcon={<ArrowRight size={17} />}>
              Truy cập Recruiter Dashboard
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
