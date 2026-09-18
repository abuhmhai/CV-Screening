import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Loader2, Sparkles, Globe2, Database, Cpu, X } from "lucide-react";
import { Button } from "../ui/button";

export interface SyncResult {
  crawled: number;
  saved: number;
  skipped: number;
  usedFallback: boolean;
}

interface SyncProgressModalProps {
  isOpen: boolean;
  isSyncing: boolean;
  result: SyncResult | null;
  error: string | null;
  onClose: () => void;
}

interface StepInfo {
  id: number;
  label: string;
  detail: string;
  minPercent: number;
  icon: typeof Globe2;
}

const STEPS: StepInfo[] = [
  {
    id: 1,
    label: "Kết nối cổng tuyển dụng",
    detail: "Khởi tạo kết nối tới ITviec, CareerViet, TopCV, VietnamWorks...",
    minPercent: 0,
    icon: Globe2
  },
  {
    id: 2,
    label: "Thu thập tin tuyển dụng",
    detail: "Đang cào dữ liệu các vị trí React, Node.js, AI, DevOps, Fullstack...",
    minPercent: 30,
    icon: Cpu
  },
  {
    id: 3,
    label: "Chuẩn hóa & Bóc tách",
    detail: "Trích xuất mức lương, địa điểm làm việc và tags kỹ năng công nghệ...",
    minPercent: 65,
    icon: Sparkles
  },
  {
    id: 4,
    label: "Đồng bộ & Khử trùng lặp",
    detail: "Cập nhật dữ liệu vào cơ sở dữ liệu và làm mới bộ nhớ đệm...",
    minPercent: 90,
    icon: Database
  }
];

export function SyncProgressModal({
  isOpen,
  isSyncing,
  result,
  error,
  onClose
}: SyncProgressModalProps) {
  const [percent, setPercent] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll so user never has to scroll page while modal is open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Smooth simulated progress during sync
  useEffect(() => {
    if (!isOpen) {
      setPercent(0);
      return;
    }

    if (error) {
      return;
    }

    if (!isSyncing && result) {
      // Completed successfully
      setPercent(100);
      return;
    }

    if (isSyncing) {
      setPercent(5);
      const interval = setInterval(() => {
        setPercent((prev) => {
          if (prev < 30) return prev + Math.floor(Math.random() * 4 + 2); // 0 -> 30 fast
          if (prev < 65) return prev + Math.floor(Math.random() * 3 + 1); // 30 -> 65 medium
          if (prev < 88) return prev + 1; // 65 -> 88 slower
          if (prev < 94) return prev + (Math.random() > 0.6 ? 1 : 0); // crawl waiting
          return prev;
        });
      }, 200);

      return () => clearInterval(interval);
    }
  }, [isOpen, isSyncing, result, error]);

  if (!isOpen || !mounted) return null;

  const currentStep =
    percent >= 100
      ? 4
      : percent >= 90
      ? 4
      : percent >= 65
      ? 3
      : percent >= 30
      ? 2
      : 1;

  const isCompleted = percent >= 100 && result !== null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={isCompleted || error ? onClose : undefined}
          className="fixed inset-0 z-0 bg-black/65 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-hairline-strong bg-surface-card p-6 sm:p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                  isCompleted
                    ? "bg-positive/15 text-positive"
                    : error
                    ? "bg-negative/15 text-negative"
                    : "bg-primary-pale text-positive-deep"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 size={26} className="animate-bounce-short text-positive" />
                ) : error ? (
                  <AlertCircle size={26} className="text-negative" />
                ) : (
                  <Loader2 size={26} className="animate-spin text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-ink">
                  {isCompleted
                    ? "Cập nhật dữ liệu thành công!"
                    : error
                    ? "Cập nhật không thành công"
                    : "Đang cập nhật việc làm mới"}
                </h3>
                <p className="text-caption text-body">
                  {isCompleted
                    ? "Hệ thống đã thu thập các tin tuyển dụng công nghệ mới nhất"
                    : error
                    ? error
                    : "Hệ thống đang cào dữ liệu từ ITviec, CareerViet, TopCV, VietnamWorks"}
                </p>
              </div>
            </div>

            {(isCompleted || error) && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-mute transition hover:bg-canvas-soft hover:text-ink"
                aria-label="Đóng"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Progress Percentage Display */}
          <div className="mt-6">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-caption font-semibold uppercase tracking-wider text-mute">
                Tiến độ xử lý
              </span>
              <span className="font-mono text-2xl font-black text-ink">
                {percent}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-elevated border border-hairline-strong p-0.5">
              <motion.div
                className={`h-full rounded-full transition-all duration-300 ${
                  isCompleted
                    ? "bg-gradient-to-r from-emerald-500 to-positive"
                    : error
                    ? "bg-negative"
                    : "bg-gradient-to-r from-primary via-emerald-400 to-positive"
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Stepper list */}
          <div className="mt-6 space-y-3">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isStepDone = percent >= 100 || percent > step.minPercent + 25;
              const isStepActive = !isStepDone && currentStep === step.id && !error;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3.5 rounded-xl border px-3.5 py-2.5 transition-all ${
                    isStepActive
                      ? "border-primary/50 bg-primary-pale/40 text-ink shadow-sm"
                      : isStepDone
                      ? "border-hairline bg-surface-card/60 text-body"
                      : "border-hairline-strong/60 bg-transparent text-mute opacity-60"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isStepDone
                        ? "bg-positive/15 text-positive"
                        : isStepActive
                        ? "bg-primary text-ink animate-pulse"
                        : "bg-surface-elevated text-mute"
                    }`}
                  >
                    {isStepDone ? (
                      <CheckCircle2 size={16} />
                    ) : isStepActive ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Icon size={16} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-body-sm font-semibold truncate ${
                          isStepActive ? "text-ink font-bold" : isStepDone ? "text-ink" : "text-mute"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isStepDone && (
                        <span className="text-[11px] font-semibold text-positive">Xong</span>
                      )}
                      {isStepActive && (
                        <span className="text-[11px] font-semibold text-positive-deep animate-pulse">
                          Đang xử lý...
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] text-mute truncate mt-0.5">{step.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Results Summary Box when Completed */}
          {isCompleted && result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl border border-positive/30 bg-accent-green-glow/50 p-4"
            >
              <div className="flex items-center gap-2 text-body-sm font-bold text-positive-deep">
                <Sparkles size={16} />
                <span>Kết quả thu thập:</span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-caption">
                <div className="rounded-lg bg-surface-card/90 p-2 text-center border border-hairline">
                  <span className="text-mute block text-[11px]">Tổng việc đã quét</span>
                  <span className="text-body-md font-extrabold text-ink">{result.crawled}</span>
                </div>
                <div className="rounded-lg bg-surface-card/90 p-2 text-center border border-hairline">
                  <span className="text-mute block text-[11px]">Việc mới lưu vào DB</span>
                  <span className="text-body-md font-extrabold text-positive">{result.saved}</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Footer */}
          <div className="mt-6 flex justify-end gap-3">
            {isCompleted ? (
              <Button
                variant="primary"
                onClick={onClose}
                className="w-full sm:w-auto px-6 font-bold"
              >
                Xem việc làm mới
              </Button>
            ) : error ? (
              <Button
                variant="secondary"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Đóng
              </Button>
            ) : (
              <div className="flex items-center gap-2 text-caption text-mute py-1">
                <Loader2 size={14} className="animate-spin text-primary" />
                <span>Vui lòng giữ cửa sổ trong vài giây...</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
