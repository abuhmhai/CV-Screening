"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { PrivacySettings } from "../../../lib/types";
import { AuthGate } from "../../../components/auth-gate";
import { PageHeader, Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Toggle } from "../../../components/ui/toggle";
import { LoadingBlock } from "../../../components/ui/states";

const DEFAULT_SETTINGS: PrivacySettings = {
  profilePublic: true,
  showActivity: true,
  allowMessagesFromNonConnections: false,
  showOnlinePresence: true
};

const PRIVACY_OPTIONS: Array<{
  key: keyof PrivacySettings;
  label: string;
  description: string;
}> = [
  {
    key: "profilePublic",
    label: "Hồ sơ công khai",
    description: "Cho phép người khác xem trang hồ sơ công khai của bạn qua đường dẫn /u/[slug]."
  },
  {
    key: "showActivity",
    label: "Hiển thị hoạt động",
    description: "Bài đăng và tương tác của bạn có thể xuất hiện với người trong mạng lưới."
  },
  {
    key: "allowMessagesFromNonConnections",
    label: "Nhắn tin từ người lạ",
    description: "Khi tắt, chỉ kết nối đã chấp nhận mới có thể gửi tin nhắn cho bạn."
  },
  {
    key: "showOnlinePresence",
    label: "Trạng thái trực tuyến",
    description: "Hiển thị khi bạn đang online trong mạng lưới và tin nhắn."
  }
];

function PrivacySettingsContent() {
  const { token } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [initial, setInitial] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    void apiFetch<PrivacySettings>("/privacy/settings", { token }).then((res) => {
      if (res.ok && res.data) {
        setSettings(res.data);
        setInitial(res.data);
      }
      setLoading(false);
    });
  }, [token]);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initial);

  const save = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    const res = await apiFetch<PrivacySettings>("/privacy/settings", {
      method: "PATCH",
      token,
      body: JSON.stringify(settings)
    });
    setSaving(false);
    if (res.ok && res.data) {
      setSettings(res.data);
      setInitial(res.data);
      toast.success("Đã lưu cài đặt quyền riêng tư");
    } else {
      toast.error(res.error ?? "Không lưu được cài đặt");
    }
  }, [token, settings]);

  if (loading) return <LoadingBlock label="Đang tải cài đặt..." />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Quyền riêng tư"
        description="Kiểm soát ai có thể xem hồ sơ, hoạt động và nhắn tin với bạn."
      />

      <Card className="space-y-1 p-2">
        <div className="flex items-center gap-2 border-b border-hairline px-3 py-3">
          <Shield size={18} className="text-accent-blue" />
          <p className="text-sm font-medium text-ink">Cài đặt hiển thị & liên lạc</p>
        </div>

        <div className="space-y-2 p-2">
          {PRIVACY_OPTIONS.map((item) => (
            <Toggle
              key={item.key}
              label={item.label}
              description={item.description}
              checked={settings[item.key]}
              disabled={saving}
              onChange={(checked) =>
                setSettings((prev) => ({
                  ...prev,
                  [item.key]: checked
                }))
              }
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-3 py-4">
          <Link href="/profile" className="text-sm text-link hover:underline">
            Quay lại hồ sơ
          </Link>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              disabled={!hasChanges || saving}
              onClick={() => setSettings(initial)}
            >
              Huỷ thay đổi
            </Button>
            <Button onClick={save} disabled={!hasChanges || saving}>
              {saving ? "Đang lưu..." : "Lưu cài đặt"}
            </Button>
          </div>
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
