"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Briefcase, Mail, MessageSquare } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { JobAlert } from "../../../lib/types";
import {
  DEFAULT_NOTIFICATION_PREFS,
  loadNotificationPrefs,
  saveNotificationPrefs
} from "../../../lib/user-prefs";
import { NotificationPrefs } from "../../../lib/types";
import { SettingsSection } from "../../../components/settings/settings-section";
import { SettingsSaveBar } from "../../../components/settings/settings-save-bar";
import { Toggle } from "../../../components/ui/toggle";
import { LoadingBlock } from "../../../components/ui/states";

const EMAIL_OPTIONS: Array<{
  key: keyof NotificationPrefs;
  label: string;
  description: string;
}> = [
  {
    key: "emailApplications",
    label: "Cập nhật đơn ứng tuyển",
    description: "Thông báo khi trạng thái hồ sơ hoặc phỏng vấn thay đổi."
  },
  {
    key: "emailMessages",
    label: "Tin nhắn mới",
    description: "Email khi có tin nhắn mới từ nhà tuyển dụng hoặc kết nối."
  },
  {
    key: "emailJobAlerts",
    label: "Cảnh báo việc làm",
    description: "Tóm tắt các tin tuyển dụng khớp với bộ lọc đã lưu."
  },
  {
    key: "emailDigest",
    label: "Bản tin hàng tuần",
    description: "Tổng hợp việc làm nổi bật và hoạt động trên nền tảng."
  },
  {
    key: "marketingEmails",
    label: "Email quảng bá",
    description: "Tính năng mới, sự kiện và nội dung từ TalentFlow."
  }
];

const PUSH_OPTIONS: Array<{
  key: keyof NotificationPrefs;
  label: string;
  description: string;
}> = [
  {
    key: "pushMessages",
    label: "Tin nhắn trực tiếp",
    description: "Thông báo đẩy khi có tin nhắn mới (trình duyệt)."
  },
  {
    key: "pushApplications",
    label: "Ứng tuyển & phỏng vấn",
    description: "Nhắc lịch phỏng vấn và cập nhật quan trọng."
  }
];

export default function NotificationsSettingsPage() {
  const { token } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [initial, setInitial] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPrefs(loadNotificationPrefs());
    setInitial(loadNotificationPrefs());
    if (!token) {
      setLoading(false);
      return;
    }
    void apiFetch<JobAlert[]>("/job-alerts", { token }).then((res) => {
      if (res.ok && res.data) setAlerts(res.data);
      setLoading(false);
    });
  }, [token]);

  const hasChanges = JSON.stringify(prefs) !== JSON.stringify(initial);

  const save = useCallback(() => {
    setSaving(true);
    saveNotificationPrefs(prefs);
    setInitial(prefs);
    setSaving(false);
    toast.success("Đã lưu tùy chọn thông báo");
  }, [prefs]);

  if (loading) return <LoadingBlock label="Đang tải thông báo..." />;

  const activeAlerts = alerts.filter((a) => a.isActive).length;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Thông báo</h2>
        <p className="mt-1 text-sm text-mute">Chọn kênh và loại thông báo bạn muốn nhận.</p>
      </div>

      <SettingsSection
        icon={Mail}
        title="Email"
        footer={
          <SettingsSaveBar
            hasChanges={hasChanges}
            saving={saving}
            onCancel={() => setPrefs(initial)}
            onSave={save}
          />
        }
      >
        {EMAIL_OPTIONS.map((item) => (
          <Toggle
            key={item.key}
            label={item.label}
            description={item.description}
            checked={prefs[item.key] as boolean}
            disabled={saving}
            onChange={(checked) => setPrefs((prev) => ({ ...prev, [item.key]: checked }))}
          />
        ))}
      </SettingsSection>

      <SettingsSection icon={MessageSquare} title="Thông báo đẩy">
        {PUSH_OPTIONS.map((item) => (
          <Toggle
            key={item.key}
            label={item.label}
            description={item.description}
            checked={prefs[item.key] as boolean}
            disabled={saving}
            onChange={(checked) => setPrefs((prev) => ({ ...prev, [item.key]: checked }))}
          />
        ))}
      </SettingsSection>

      <SettingsSection icon={Briefcase} title="Cảnh báo việc làm">
        <div className="rounded-lg border border-hairline bg-surface-elevated p-4 mx-1">
          <p className="text-sm text-body">
            Bạn có <strong>{activeAlerts}</strong> cảnh báo đang bật
            {alerts.length > 0 ? ` / ${alerts.length} tổng cộng` : ""}.
          </p>
          <Link
            href="/saved-jobs"
            className="mt-3 inline-block text-sm text-link hover:underline"
          >
            Quản lý cảnh báo việc làm
          </Link>
        </div>
      </SettingsSection>

      <SettingsSection icon={Bell} title="Lưu ý">
        <p className="px-1 pb-2 text-sm text-mute">
          Tùy chọn email được lưu trên thiết bị này. Cảnh báo việc làm được đồng bộ với tài khoản
          trên máy chủ.
        </p>
      </SettingsSection>
    </div>
  );
}
