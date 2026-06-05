"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { Company } from "../../../lib/types";
import { AuthGate } from "../../../components/auth-gate";
import { PageHeader, Card } from "../../../components/ui/card";
import { Select } from "../../../components/ui/input";
import { LoadingBlock } from "../../../components/ui/states";
import {
  AnimatedNumber,
  PipelineBarChart,
  PipelineFunnel,
  ConversionDonut,
  ScoreGauge,
  StageComparisonChart,
  computeConversionRates,
  STATUS_LABELS
} from "../../../components/recruiter/analytics-charts";
import {
  Briefcase,
  Users,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  BarChart3,
  GitBranch,
  Target
} from "lucide-react";

interface CompanyAnalytics {
  jobsCount: number;
  activeJobs: number;
  totalApplications: number;
  avgAiScore: number;
  aiPassRate: number;
  hiredCount: number;
  avgTimeToHireDays: number;
  statusCounts: Record<string, number>;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
};

function AnimatedStatCard({
  label,
  value,
  numericValue,
  suffix = "",
  decimals = 0,
  icon,
  highlight = false
}: {
  label: string;
  value?: string;
  numericValue?: number;
  suffix?: string;
  decimals?: number;
  icon: ReactNode;
  highlight?: boolean;
}) {
  return (
    <motion.article
      variants={item}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`rounded-xl p-5 shadow-[0_1px_0_rgba(14,15,12,0.04)] ${
        highlight ? "bg-primary-pale ring-1 ring-primary/30" : "bg-canvas"
      }`}
    >
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-canvas-soft text-ink-deep">
        {icon}
      </div>
      <p className="text-body-sm font-semibold text-body">{label}</p>
      <p className="mt-2 text-2xl font-black text-ink">
        {numericValue !== undefined ? (
          <AnimatedNumber value={numericValue} decimals={decimals} suffix={suffix} />
        ) : (
          value
        )}
      </p>
    </motion.article>
  );
}

function RecruiterAnalyticsContent() {
  const { token } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [analytics, setAnalytics] = useState<CompanyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    void apiFetch<Company[]>("/companies", { token }).then((res) => {
      if (res.ok && res.data) {
        setCompanies(res.data);
        if (res.data[0]) setSelectedCompany(res.data[0].id);
      }
    });
  }, [token]);

  useEffect(() => {
    if (!token || !selectedCompany) return;
    setLoading(true);
    void apiFetch<CompanyAnalytics>(`/companies/${selectedCompany}/analytics`, { token }).then((res) => {
      if (res.ok && res.data) setAnalytics(res.data);
      setLoading(false);
    });
  }, [token, selectedCompany]);

  const conversionRates = useMemo(
    () => computeConversionRates(analytics?.statusCounts ?? {}),
    [analytics?.statusCounts]
  );

  const companyName = companies.find((c) => c.id === selectedCompany)?.name ?? "";

  if (loading && !analytics) return <LoadingBlock />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Recruiter Analytics"
        description="Theo dõi pipeline conversion, volume và chất lượng ứng viên theo AI score."
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="flex flex-wrap items-end justify-between gap-4 p-6">
          <div className="max-w-sm flex-1">
            <label className="mb-2 block text-body-sm font-semibold text-ink">Công ty</label>
            <Select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
          </div>
          {companyName ? (
            <p className="text-body-sm text-mute">
              Dữ liệu cho <span className="font-semibold text-ink">{companyName}</span>
            </p>
          ) : null}
        </Card>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCompany + (analytics ? "loaded" : "empty")}
          variants={container}
          initial="hidden"
          animate="show"
          exit={{ opacity: 0 }}
          className="space-y-8"
        >
          <motion.div variants={container} className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
            <AnimatedStatCard
              label="Total Jobs"
              numericValue={analytics?.jobsCount ?? 0}
              icon={<Briefcase size={18} />}
            />
            <AnimatedStatCard
              label="Active Jobs"
              numericValue={analytics?.activeJobs ?? 0}
              icon={<Target size={18} />}
            />
            <AnimatedStatCard
              label="Applications"
              numericValue={analytics?.totalApplications ?? 0}
              icon={<Users size={18} />}
              highlight
            />
            <AnimatedStatCard
              label="Avg AI Score"
              numericValue={analytics?.avgAiScore ?? 0}
              decimals={1}
              icon={<Sparkles size={18} />}
            />
            <AnimatedStatCard
              label="AI Pass Rate"
              numericValue={analytics?.aiPassRate ?? 0}
              suffix="%"
              decimals={1}
              icon={<TrendingUp size={18} />}
            />
            <AnimatedStatCard
              label="Hired"
              numericValue={analytics?.hiredCount ?? 0}
              icon={<CheckCircle2 size={18} />}
            />
            <AnimatedStatCard
              label="Avg Time-to-Hire"
              numericValue={analytics?.avgTimeToHireDays ?? 0}
              suffix=" days"
              decimals={1}
              icon={<Clock size={18} />}
            />
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div variants={item} className="h-full">
              <Card className="h-full p-6">
                <div className="mb-6 flex items-center gap-2">
                  <BarChart3 size={20} className="text-ink-deep" />
                  <h2 className="text-lg font-semibold text-ink">Pipeline theo giai đoạn</h2>
                </div>
                <div className="flex justify-center">
                  <StageComparisonChart statusCounts={analytics?.statusCounts ?? {}} />
                </div>
              </Card>
            </motion.div>

            <motion.div variants={item} className="h-full">
              <Card className="h-full p-6">
                <div className="mb-6 flex items-center gap-2">
                  <GitBranch size={20} className="text-ink-deep" />
                  <h2 className="text-lg font-semibold text-ink">Phễu tuyển dụng</h2>
                </div>
                <PipelineFunnel statusCounts={analytics?.statusCounts ?? {}} />
              </Card>
            </motion.div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px_280px]">
            <motion.div variants={item} className="h-full">
              <Card className="h-full p-6">
                <h2 className="mb-6 text-lg font-semibold text-ink">Phân bố pipeline</h2>
                <PipelineBarChart statusCounts={analytics?.statusCounts ?? {}} />
              </Card>
            </motion.div>

            <motion.div variants={item} className="h-full">
              <Card className="flex h-full flex-col items-center justify-center py-8">
                <h2 className="mb-6 text-base font-semibold text-ink">AI Pass Rate</h2>
                <div className="relative">
                  <ConversionDonut
                    passRate={analytics?.aiPassRate ?? 0}
                    total={analytics?.totalApplications ?? 0}
                  />
                </div>
              </Card>
            </motion.div>

            <motion.div variants={item} className="h-full">
              <Card className="flex h-full flex-col items-center justify-center py-8 bg-canvas-soft border border-ink/5">
                <h2 className="mb-6 text-base font-semibold text-ink">Điểm AI trung bình</h2>
                <ScoreGauge score={analytics?.avgAiScore ?? 0} />
              </Card>
            </motion.div>
          </div>

          <motion.div variants={item}>
            <Card className="p-6">
              <h2 className="mb-6 text-lg font-semibold text-ink">Tỷ lệ chuyển đổi giữa các bước</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {conversionRates.map((step, i) => (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="rounded-xl bg-canvas-soft p-4 text-center"
                  >
                    <p className="text-caption font-semibold uppercase tracking-wider text-mute">
                      {step.label}
                    </p>
                    <p className="mt-2 text-2xl font-black text-ink-deep tabular-nums">
                      <AnimatedNumber value={step.rate} decimals={1} suffix="%" />
                    </p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-ink">Chi tiết trạng thái</h2>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {Object.entries(analytics?.statusCounts ?? {}).map(([status, count], i) => (
                  <motion.div
                    key={status}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    className="rounded-xl border border-ink/5 bg-canvas-soft p-4"
                  >
                    <p className="text-caption font-semibold text-mute">
                      {STATUS_LABELS[status] ?? status}
                    </p>
                    <p className="mt-1 text-2xl font-black text-ink tabular-nums">{count}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function RecruiterAnalyticsPage() {
  return (
    <AuthGate roles={["RECRUITER", "ADMIN"]}>
      <RecruiterAnalyticsContent />
    </AuthGate>
  );
}
