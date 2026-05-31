"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/auth-context";
import { apiFetch } from "../../lib/api-client";
import { OnboardingChecklist } from "../../lib/types";
import { AuthGate } from "../../components/auth-gate";
import { PageHeader, Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { FieldLabel, Input, Textarea } from "../../components/ui/input";
import { LoadingBlock } from "../../components/ui/states";

function OnboardingContent() {
  const { token, refreshUser } = useAuth();
  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    headline: "",
    about: "",
    location: ""
  });

  async function loadChecklist() {
    if (!token) return;
    const result = await apiFetch<OnboardingChecklist>("/users/me/onboarding-checklist", { token });
    if (result.ok && result.data) {
      setChecklist(result.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    void loadChecklist();
  }, [token]);

  const pendingItems = useMemo(
    () => (checklist?.items ?? []).filter((item) => !item.done),
    [checklist]
  );

  async function saveProfile() {
    if (!token) return;
    setSaving(true);
    await apiFetch("/users/me/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify(form)
    });
    setSaving(false);
    await refreshUser();
    await loadChecklist();
  }

  if (loading) return <LoadingBlock />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hoàn thiện hồ sơ"
        description="Hoàn thiện hồ sơ để tăng matching score, hiển thị tốt hơn trong network và recommendation."
      />

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tiến độ</h2>
          <div className="text-sm font-semibold">{checklist?.completion ?? 0}%</div>
        </div>
        <div className="h-3 overflow-hidden rounded-pill bg-canvas-soft">
          <div
            className="h-full rounded-pill bg-primary transition-all"
            style={{ width: `${checklist?.completion ?? 0}%` }}
          />
        </div>
        <ul className="mt-5 space-y-2">
          {(checklist?.items ?? []).map((item) => (
            <li
              key={item.key}
              className={`rounded-lg px-4 py-3 text-sm font-medium ${
                item.done ? "bg-primary-pale text-ink-deep" : "bg-canvas-soft text-body"
              }`}
            >
              {item.done ? "✓" : "○"} {item.label}
            </li>
          ))}
        </ul>
      </Card>

      {pendingItems.length > 0 ? (
        <Card>
          <h2 className="text-lg font-semibold">Thiết lập hồ sơ nhanh</h2>
          <p className="mt-1 text-sm text-body">
            Cập nhật nhanh các trường cơ bản để hoàn tất onboarding.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FieldLabel label="Họ tên">
              <Input
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </FieldLabel>
            <FieldLabel label="Địa điểm">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </FieldLabel>
            <FieldLabel label="Headline">
              <Input
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
              />
            </FieldLabel>
            <FieldLabel label="Giới thiệu">
              <Textarea
                rows={3}
                value={form.about}
                onChange={(e) => setForm({ ...form, about: e.target.value })}
              />
            </FieldLabel>
          </div>
          <div className="mt-5">
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu hồ sơ và cập nhật checklist"}
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthGate>
      <OnboardingContent />
    </AuthGate>
  );
}
