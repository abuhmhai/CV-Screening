"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Globe, UserCircle } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { UserProfile } from "../../../lib/types";
import { SettingsSection } from "../../../components/settings/settings-section";
import { SettingsSaveBar } from "../../../components/settings/settings-save-bar";
import { FieldLabel, Input, Textarea } from "../../../components/ui/input";
import { LoadingBlock } from "../../../components/ui/states";

type ProfileForm = {
  fullName: string;
  headline: string;
  location: string;
  about: string;
};

const EMPTY_FORM: ProfileForm = {
  fullName: "",
  headline: "",
  location: "",
  about: ""
};

export default function ProfileSettingsPage() {
  const { user, token } = useAuth();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [initial, setInitial] = useState<ProfileForm>(EMPTY_FORM);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token || !user?.id) return;
    void apiFetch<UserProfile>(`/users/${user.id}/profile`, { token }).then((res) => {
      if (res.ok && res.data?.profile) {
        const next = {
          fullName: res.data.profile.fullName ?? "",
          headline: res.data.profile.headline ?? "",
          location: res.data.profile.location ?? "",
          about: res.data.profile.about ?? ""
        };
        setForm(next);
        setInitial(next);
        setPublicSlug(res.data.profile.publicSlug ?? null);
      }
      setLoading(false);
    });
  }, [token, user?.id]);

  const hasChanges = JSON.stringify(form) !== JSON.stringify(initial);

  const save = useCallback(async () => {
    if (!token) return;
    setSaving(true);
    const res = await apiFetch("/users/me/profile", {
      method: "PATCH",
      token,
      body: JSON.stringify(form)
    });
    setSaving(false);
    if (res.ok) {
      setInitial(form);
      toast.success("Đã cập nhật hồ sơ");
    } else {
      toast.error(res.error ?? "Không lưu được hồ sơ");
    }
  }, [token, form]);

  if (loading) return <LoadingBlock label="Đang tải hồ sơ..." />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Hồ sơ</h2>
        <p className="mt-1 text-sm text-mute">Chỉnh sửa thông tin hiển thị công khai trên hồ sơ.</p>
      </div>

      <SettingsSection
        icon={UserCircle}
        title="Thông tin hiển thị"
        footer={
          <SettingsSaveBar
            hasChanges={hasChanges}
            saving={saving}
            onCancel={() => setForm(initial)}
            onSave={save}
            leftSlot={
              <Link href="/profile" className="text-sm text-link hover:underline">
                Mở trình chỉnh sửa đầy đủ
              </Link>
            }
          />
        }
      >
        <div className="space-y-4 px-1">
          <div>
            <FieldLabel>Họ và tên</FieldLabel>
            <Input
              value={form.fullName}
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Tiêu đề / Headline</FieldLabel>
            <Input
              value={form.headline}
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, headline: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Địa điểm</FieldLabel>
            <Input
              value={form.location}
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            />
          </div>
          <div>
            <FieldLabel>Giới thiệu</FieldLabel>
            <Textarea
              value={form.about}
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, about: e.target.value }))}
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={Globe} title="Hồ sơ công khai">
        <div className="rounded-lg border border-hairline bg-surface-elevated p-4 px-1 mx-1">
          {publicSlug ? (
            <p className="text-sm text-body">
              Trang công khai:{" "}
              <Link href={`/u/${publicSlug}`} className="text-link hover:underline">
                /u/{publicSlug}
              </Link>
            </p>
          ) : (
            <p className="text-sm text-mute">
              Chưa có đường dẫn công khai. Tạo từ trang{" "}
              <Link href="/profile" className="text-link hover:underline">
                Hồ sơ
              </Link>
              .
            </p>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}
