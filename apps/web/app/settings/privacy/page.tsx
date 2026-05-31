"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { PrivacySettings } from "../../../lib/types";
import { AuthGate } from "../../../components/auth-gate";
import { PageHeader, Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

function PrivacySettingsContent() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    profilePublic: true,
    showActivity: true,
    allowMessagesFromNonConnections: false,
    showOnlinePresence: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    void apiFetch<PrivacySettings>("/privacy/settings", { token }).then((res) => {
      if (res.ok && res.data) setSettings(res.data);
    });
  }, [token]);

  async function save() {
    if (!token) return;
    setSaving(true);
    await apiFetch("/privacy/settings", {
      method: "PATCH",
      token,
      body: JSON.stringify(settings)
    });
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quyền riêng tư"
        description="Kiểm soát hiển thị hồ sơ, hoạt động và quyền nhắn tin của bạn."
      />
      <Card>
        <div className="space-y-4">
          {[
            {
              key: "profilePublic",
              label: "Hiển thị hồ sơ công khai",
              checked: settings.profilePublic
            },
            {
              key: "showActivity",
              label: "Hiển thị hoạt động với mạng lưới",
              checked: settings.showActivity
            },
            {
              key: "allowMessagesFromNonConnections",
              label: "Cho phép người chưa kết nối nhắn tin",
              checked: settings.allowMessagesFromNonConnections
            },
            {
              key: "showOnlinePresence",
              label: "Hiển thị trạng thái online",
              checked: settings.showOnlinePresence
            }
          ].map((item) => (
            <label key={item.key} className="flex cursor-pointer items-center justify-between gap-4 rounded-lg bg-canvas-soft p-4 transition hover:bg-primary-pale">
              <span className="text-sm font-semibold">{item.label}</span>
              <input
                type="checkbox"
                checked={item.checked}
                className="h-5 w-5 accent-[var(--colors-primary)]"
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    [item.key]: e.target.checked
                  }))
                }
              />
            </label>
          ))}
        </div>
        <div className="mt-5">
          <Button onClick={save} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu cài đặt"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function PrivacySettingsPage() {
  return (
    <AuthGate>
      <PrivacySettingsContent />
    </AuthGate>
  );
}
