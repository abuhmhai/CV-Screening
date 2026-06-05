"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { colors } from "../../lib/design-tokens";

const PIPELINE_ORDER = [
  "APPLIED",
  "AI_SCREENING",
  "HR_REVIEW",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED"
] as const;

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Đã nộp",
  AI_SCREENING: "AI Screening",
  HR_REVIEW: "HR Review",
  INTERVIEW: "Phỏng vấn",
  OFFER: "Đề nghị",
  HIRED: "Đã tuyển",
  REJECTED: "Từ chối"
};

const STATUS_COLORS: Record<string, string> = {
  APPLIED: colors.canvasSoft,
  AI_SCREENING: colors.primaryPale,
  HR_REVIEW: colors.primaryNeutral,
  INTERVIEW: colors.accentCyan,
  OFFER: colors.primary,
  HIRED: colors.positiveDeep,
  REJECTED: colors.negative
};

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = ""
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-24px" });
  const spring = useSpring(0, { stiffness: 60, damping: 18 });
  const display = useTransform(spring, (v) => v.toFixed(decimals) + suffix);

  useEffect(() => {
    if (isInView) spring.set(value);
  }, [isInView, value, spring]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {display}
    </motion.span>
  );
}

export function PipelineBarChart({ statusCounts }: { statusCounts: Record<string, number> }) {
  const items = PIPELINE_ORDER.map((key) => ({
    key,
    label: STATUS_LABELS[key] ?? key,
    count: statusCounts[key] ?? 0,
    color: STATUS_COLORS[key] ?? colors.mute
  }));
  const max = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
        >
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="font-medium text-ink">{item.label}</span>
            <span className="font-bold tabular-nums text-ink">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-canvas-soft shadow-inner">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: item.color }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.count / max) * 100}%` }}
              transition={{ delay: 0.15 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function PipelineFunnel({ statusCounts }: { statusCounts: Record<string, number> }) {
  const hired = statusCounts.HIRED ?? 0;
  const offer = hired + (statusCounts.OFFER ?? 0);
  const interview = offer + (statusCounts.INTERVIEW ?? 0);
  const hr = interview + (statusCounts.HR_REVIEW ?? 0);
  const screening = hr + (statusCounts.AI_SCREENING ?? 0);
  const applied = screening + (statusCounts.APPLIED ?? 0) + (statusCounts.REJECTED ?? 0);

  const funnelData = [
    { key: "APPLIED", label: "Tổng ứng viên", count: applied },
    { key: "AI_SCREENING", label: "Qua AI Screening", count: screening },
    { key: "HR_REVIEW", label: "Qua HR Review", count: hr },
    { key: "INTERVIEW", label: "Tới Phỏng vấn", count: interview },
    { key: "OFFER", label: "Nhận Offer", count: offer },
    { key: "HIRED", label: "Đã tuyển", count: hired }
  ];

  const max = Math.max(applied, 1);

  return (
    <div className="flex flex-col items-center py-2 space-y-1.5">
      {funnelData.map((item, i) => {
        const widthPct = 40 + (item.count / max) * 60;
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-full flex-col items-center"
            style={{ originX: 0.5 }}
          >
            <div
              className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm transition-colors relative overflow-hidden shadow-sm"
              style={{
                width: `${widthPct}%`,
                backgroundColor: "var(--bg-canvas-soft)",
                border: "1px solid var(--ink-10)"
              }}
            >
              <div 
                className="absolute left-0 top-0 h-full opacity-20"
                style={{ 
                  width: '100%',
                  backgroundColor: STATUS_COLORS[item.key] || "var(--ink)"
                }}
              />
              <span className="font-medium text-ink relative z-10">{item.label}</span>
              <span className="font-bold tabular-nums text-ink relative z-10">{item.count}</span>
            </div>
            {i < funnelData.length - 1 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="my-0.5 h-3 w-px bg-ink/20"
              />
            ) : null}
          </motion.div>
        );
      })}
      {(statusCounts.REJECTED ?? 0) > 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 flex items-center gap-1.5 rounded-full bg-accent-red-glow px-3 py-1 text-xs font-semibold text-negative"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-negative" />
          {statusCounts.REJECTED} ứng viên bị từ chối
        </motion.p>
      ) : null}
    </div>
  );
}

export function ConversionDonut({
  passRate,
  total
}: {
  passRate: number;
  total: number;
}) {
  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const passPct = Math.min(100, Math.max(0, passRate));
  const offset = circumference - (passPct / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.canvasSoft}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colors.positiveDeep}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <motion.span
          className="text-3xl font-black text-positive-deep tabular-nums"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {passPct.toFixed(0)}%
        </motion.span>
        <span className="text-caption font-semibold text-mute">AI Pass</span>
      </div>
      <p className="mt-3 text-center text-body-sm text-body">
        <span className="font-semibold text-ink">{total}</span> đơn ứng tuyển
      </p>
    </div>
  );
}

export function ScoreGauge({ score, max = 100 }: { score: number; max?: number }) {
  const size = 140;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circumference = Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / max));
  const offset = circumference - pct * circumference;

  let strokeColor: string = colors.positiveDeep;
  if (score < 50) strokeColor = colors.negative;
  else if (score < 75) strokeColor = colors.warningDeep;

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size / 2 + stroke} className="overflow-visible">
        <path
          d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke={colors.canvasSoft}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        <motion.path
          d={`M ${stroke / 2} ${size / 2} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${size / 2}`}
          fill="none"
          stroke={strokeColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
        />
      </svg>
      <div className="absolute bottom-0 flex flex-col items-center">
        <motion.span
          className="text-3xl font-black tabular-nums text-ink"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {score.toFixed(1)}
        </motion.span>
        <span className="text-caption font-semibold text-mute">/ {max} điểm TB</span>
      </div>
    </div>
  );
}

const SHORT_LABELS: Record<string, string> = {
  APPLIED: "Đã nộp",
  AI_SCREENING: "AI",
  HR_REVIEW: "HR",
  INTERVIEW: "Phỏng vấn",
  OFFER: "Offer",
  HIRED: "Đã tuyển",
  REJECTED: "Từ chối"
};

export function StageComparisonChart({ statusCounts }: { statusCounts: Record<string, number> }) {
  const active = PIPELINE_ORDER.filter((s) => s !== "REJECTED").map((key) => ({
    key,
    label: SHORT_LABELS[key] ?? STATUS_LABELS[key]?.split(" ")[0] ?? key,
    count: statusCounts[key] ?? 0
  }));
  const chartH = 140;
  const chartW = 340;
  const max = Math.max(...active.map((a) => a.count), 1);
  const barW = chartW / active.length - 12;

  return (
    <svg viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full h-full max-h-64 object-contain">
      {active.map((item, i) => {
        const barH = (item.count / max) * chartH;
        const x = i * (barW + 12) + 6;
        const y = chartH - barH;
        return (
          <g key={item.key}>
            <motion.rect
              x={x}
              y={chartH}
              width={barW}
              height={0}
              rx={6}
              fill={STATUS_COLORS[item.key]}
              animate={{ y, height: barH }}
              transition={{ delay: 0.1 + i * 0.06, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            />
            <text
              x={x + barW / 2}
              y={chartH + 20}
              textAnchor="middle"
              className="fill-body text-[10px] font-semibold"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {item.label}
            </text>
            <motion.text
              x={x + barW / 2}
              y={y - 6}
              textAnchor="middle"
              className="fill-ink text-[12px] font-black"
              initial={{ opacity: 0 }}
              animate={{ opacity: item.count > 0 ? 1 : 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              {item.count}
            </motion.text>
          </g>
        );
      })}
    </svg>
  );
}

export function computeConversionRates(statusCounts: Record<string, number>) {
  const hired = statusCounts.HIRED ?? 0;
  const offer = hired + (statusCounts.OFFER ?? 0);
  const interview = offer + (statusCounts.INTERVIEW ?? 0);
  const hr = interview + (statusCounts.HR_REVIEW ?? 0);
  const screening = hr + (statusCounts.AI_SCREENING ?? 0);
  const total = screening + (statusCounts.APPLIED ?? 0) + (statusCounts.REJECTED ?? 0) || 1;

  return [
    { label: "AI → HR", rate: screening ? (hr / screening) * 100 : 0 },
    { label: "HR → PV", rate: hr ? (interview / hr) * 100 : 0 },
    { label: "PV → Offer", rate: interview ? (offer / interview) * 100 : 0 },
    { label: "Offer → Hire", rate: offer ? (hired / offer) * 100 : 0 },
    { label: "Tổng pipeline", rate: (hired / total) * 100 }
  ];
}

export { PIPELINE_ORDER, STATUS_LABELS };
