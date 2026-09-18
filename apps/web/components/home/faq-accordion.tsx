"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    question: "AI chấm điểm CV và đo độ phù hợp (Match Score) dựa trên những yếu tố nào?",
    answer:
      "Hệ thống phân tích đa chiều dựa trên mô tả công việc (JD): (1) Kỹ năng kỹ thuật bắt buộc và tùy chọn (Hard skills), (2) Số năm kinh nghiệm làm việc thực tế, (3) Độ phức tạp của các dự án đã triển khai, (4) Ngoại ngữ và chứng chỉ chuyên ngành. Kết quả trả về gồm % tương thích, danh sách kỹ năng đạt / thiếu và lời khuyên chuẩn bị phỏng vấn."
  },
  {
    question: "Kho việc làm tổng hợp được thu thập tự động từ những nguồn nào?",
    answer:
      "TalentFlow tích hợp hệ thống crawler tự động cào dữ liệu từ 4 cổng tuyển dụng hàng đầu Việt Nam: ITviec, CareerViet, TopCV và VietnamWorks. Toàn bộ dữ liệu được chuẩn hóa, khử trùng lặp và tự động cập nhật liên tục mỗi 30 phút."
  },
  {
    question: "Tôi có thể tải lên file CV có sẵn hay phải tạo CV mới trên hệ thống?",
    answer:
      "Bạn có thể sử dụng cả hai cách! Bạn có thể tải lên file CV có sẵn (PDF, DOCX) để AI quét và trích xuất dữ liệu, hoặc sử dụng tính năng Tạo CV với AI (CV Builder) để thiết kế hồ sơ chuẩn quốc tế ATS với các gợi ý từ vựng chuyên ngành."
  },
  {
    question: "Nhà tuyển dụng được hưởng những lợi ích gì trên nền tảng TalentFlow?",
    answer:
      "Nhà tuyển dụng có thể đăng tin nhanh chóng, sử dụng AI để tự động sàng lọc và xếp hạng hồ sơ ứng viên theo độ tương thích với JD, quản lý quy trình phỏng vấn trên Dashboard trực quan và theo dõi báo cáo phân tích hiệu suất tuyển dụng."
  },
  {
    question: "Làm thế nào để trải nghiệm thử tất cả tính năng ngay bây giờ?",
    answer:
      "Rất đơn giản! Hãy bấm nút 'Trải nghiệm Demo' ngay tại đầu trang chủ. Hệ thống sẽ tự động đăng nhập vào tài khoản mẫu đầy đủ dữ liệu để bạn thử nghiệm cào việc làm, chấm điểm AI và kết nối mạng lưới ngay lập tức mà không cần tạo tài khoản."
  }
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="text-center mb-10">
        <span className="rounded-pill bg-primary/15 px-3 py-1 text-caption font-bold text-positive-deep uppercase tracking-wider">
          Giải Đáp Thắc Mắc
        </span>
        <h2 className="mt-4 font-display text-[32px] leading-tight font-black text-ink sm:text-[42px]">
          Câu hỏi thường gặp (FAQ)
        </h2>
        <p className="mt-3 text-body-md text-body">
          Những câu hỏi phổ biến nhất về công nghệ AI và hệ thống việc làm của TalentFlow.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-colors ${
                isOpen ? "border-primary/50 bg-surface-card shadow-sm" : "border-hairline bg-surface-card/60 hover:border-hairline-strong"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="flex w-full items-center justify-between p-5 text-left transition"
                aria-expanded={isOpen}
              >
                <span className="flex items-center gap-3 text-body-sm font-bold text-ink pr-4">
                  <HelpCircle size={18} className={isOpen ? "text-primary shrink-0" : "text-mute shrink-0"} />
                  <span>{faq.question}</span>
                </span>
                <ChevronDown
                  size={18}
                  className={`text-mute shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180 text-ink" : ""}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 text-body-sm text-body leading-relaxed border-t border-hairline/60">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
