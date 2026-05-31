"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { Company } from "../../../lib/types";
import { AuthGate } from "../../../components/auth-gate";
import { PageHeader, Card } from "../../../components/ui/card";
import { Select } from "../../../components/ui/input";
import { StatCard } from "../../../components/stat-card";
import { LoadingBlock } from "../../../components/ui/states";

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
      if (res.ok && res.data) {
        setAnalytics(res.data);
      }
      setLoading(false);
    });
  }, [token, selectedCompany]);

  if (loading && !analytics) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Analytics"
        description="Theo dõi pipeline conversion, volume và chất lượng ứng viên theo AI score."
      />
      <Card>
        <div className="max-w-sm">
          <Select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
        <StatCard label="Total Jobs" value={String(analytics?.jobsCount ?? 0)} />
        <StatCard label="Active Jobs" value={String(analytics?.activeJobs ?? 0)} />
        <StatCard label="Applications" value={String(analytics?.totalApplications ?? 0)} tone="positive" />
        <StatCard label="Avg AI Score" value={(analytics?.avgAiScore ?? 0).toFixed(1)} tone="warning" />
        <StatCard label="AI Pass Rate" value={`${(analytics?.aiPassRate ?? 0).toFixed(1)}%`} />
        <StatCard label="Hired" value={String(analytics?.hiredCount ?? 0)} />
        <StatCard label="Avg Time-to-Hire" value={`${(analytics?.avgTimeToHireDays ?? 0).toFixed(1)} days`} />
      </div>
      <Card>
        <h2 className="text-lg font-semibold">Pipeline distribution</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {Object.entries(analytics?.statusCounts ?? {}).map(([status, count]) => (
            <div key={status} className="rounded-lg bg-canvas-soft p-4 text-sm">
              <p className="text-mute">{status}</p>
              <p className="text-xl font-black text-ink">{count}</p>
            </div>
          ))}
        </div>
      </Card>
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
