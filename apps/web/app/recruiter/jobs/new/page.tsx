"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../lib/auth-context";
import { apiFetch } from "../../../../lib/api-client";
import { Company } from "../../../../lib/types";
import { AuthGate } from "../../../../components/auth-gate";
import { PageHeader, Card } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { FieldLabel, Input, Select, Textarea } from "../../../../components/ui/input";

function CreateJobContent() {
  const { token } = useAuth();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    companyId: "",
    title: "",
    description: "",
    jobType: "FULL_TIME",
    level: "MID",
    location: "Ho Chi Minh City",
    minSalary: "20000000",
    maxSalary: "40000000",
    requiredSkills: "TypeScript, NestJS, PostgreSQL"
  });

  useEffect(() => {
    if (!token) return;
    void apiFetch<Company[]>("/companies", { token }).then((res) => {
      if (res.ok && res.data) {
        setCompanies(res.data);
        if (res.data[0]) setForm((f) => ({ ...f, companyId: res.data![0].id }));
      }
    });
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError(null);
    const res = await apiFetch("/jobs", {
      method: "POST",
      token,
      body: JSON.stringify({
        companyId: form.companyId,
        title: form.title,
        description: form.description,
        jobType: form.jobType,
        level: form.level,
        location: form.location,
        minSalary: Number(form.minSalary),
        maxSalary: Number(form.maxSalary),
        salaryCurrency: "VND",
        requiredSkills: form.requiredSkills.split(",").map((s) => s.trim()).filter(Boolean)
      })
    });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Tạo tin thất bại");
      return;
    }
    router.push("/recruiter/dashboard");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Đăng tin tuyển dụng"
        description="Tạo job posting có cấu trúc với kỹ năng yêu cầu và mức lương."
      />

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FieldLabel label="Công ty">
            <Select
              required
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </FieldLabel>
          <FieldLabel label="Tiêu đề">
            <Input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Senior Backend Engineer"
            />
          </FieldLabel>
          <FieldLabel label="Mô tả">
            <Textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FieldLabel>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldLabel label="Loại hình">
              <Select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
                <option value="FULL_TIME">FULL_TIME</option>
                <option value="HYBRID">HYBRID</option>
                <option value="REMOTE">REMOTE</option>
              </Select>
            </FieldLabel>
            <FieldLabel label="Cấp bậc">
              <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                <option value="JUNIOR">JUNIOR</option>
                <option value="MID">MID</option>
                <option value="SENIOR">SENIOR</option>
              </Select>
            </FieldLabel>
          </div>
          <FieldLabel label="Địa điểm">
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </FieldLabel>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldLabel label="Lương tối thiểu (VNĐ/tháng)">
              <Input type="number" min={0} step={1_000_000} value={form.minSalary} onChange={(e) => setForm({ ...form, minSalary: e.target.value })} placeholder="20000000" />
            </FieldLabel>
            <FieldLabel label="Lương tối đa (VNĐ/tháng)">
              <Input type="number" min={0} step={1_000_000} value={form.maxSalary} onChange={(e) => setForm({ ...form, maxSalary: e.target.value })} placeholder="40000000" />
            </FieldLabel>
          </div>
          <FieldLabel label="Kỹ năng (phân cách bằng dấu phẩy)">
            <Input value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} />
          </FieldLabel>
          {error ? <p className="text-sm text-negative">{error}</p> : null}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Đang tạo..." : "Tạo tin tuyển dụng"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

export default function CreateJobPage() {
  return (
    <AuthGate roles={["RECRUITER", "ADMIN"]}>
      <CreateJobContent />
    </AuthGate>
  );
}
