"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Contrast, Layout, Palette, Type } from "lucide-react";
import { AppearancePrefs } from "../../../lib/types";
import {
  DEFAULT_APPEARANCE_PREFS,
  loadAppearancePrefs,
  saveAppearancePrefs
} from "../../../lib/user-prefs";
import { SettingsSection } from "../../../components/settings/settings-section";
import { SettingsSaveBar } from "../../../components/settings/settings-save-bar";
import { Toggle } from "../../../components/ui/toggle";
import { FieldLabel, Select } from "../../../components/ui/input";

export default function AppearanceSettingsPage() {
  const [prefs, setPrefs] = useState<AppearancePrefs>(DEFAULT_APPEARANCE_PREFS);
  const [initial, setInitial] = useState<AppearancePrefs>(DEFAULT_APPEARANCE_PREFS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loaded = loadAppearancePrefs();
    setPrefs(loaded);
    setInitial(loaded);
  }, []);

  const hasChanges = JSON.stringify(prefs) !== JSON.stringify(initial);

  const save = useCallback(() => {
    setSaving(true);
    saveAppearancePrefs(prefs);
    setInitial(prefs);
    setSaving(false);
    toast.success("Đã lưu giao diện");
  }, [prefs]);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Giao diện</h2>
        <p className="mt-1 text-sm text-mute">Tùy chỉnh cách hiển thị nội dung trên thiết bị này.</p>
      </div>

      <SettingsSection
        icon={Type}
        title="Chữ & bố cục"
        footer={
          <SettingsSaveBar
            hasChanges={hasChanges}
            saving={saving}
            onCancel={() => {
              setPrefs(initial);
              saveAppearancePrefs(initial);
            }}
            onSave={save}
          />
        }
      >
        <div className="space-y-4 px-1">
          <FieldLabel label="Cỡ chữ">
            <Select
              value={prefs.fontSize}
              disabled={saving}
              onChange={(e) =>
                setPrefs((prev) => ({
                  ...prev,
                  fontSize: e.target.value as AppearancePrefs["fontSize"]
                }))
              }
            >
              <option value="default">Mặc định</option>
              <option value="large">Lớn hơn</option>
            </Select>
          </FieldLabel>

          <Toggle
            label="Chế độ gọn"
            description="Giảm khoảng cách và padding trên các thẻ nội dung."
            checked={prefs.compactMode}
            disabled={saving}
            onChange={(checked) => setPrefs((prev) => ({ ...prev, compactMode: checked }))}
          />
        </div>
      </SettingsSection>

      <SettingsSection icon={Palette} title="Chuyển động & độ tương phản">
        <Toggle
          label="Giảm chuyển động"
          description="Tắt hầu hết hiệu ứng chuyển cảnh và animation."
          checked={prefs.reduceMotion}
          disabled={saving}
          onChange={(checked) => setPrefs((prev) => ({ ...prev, reduceMotion: checked }))}
        />
        <Toggle
          label="Tương phản cao"
          description="Làm nổi bật viền và chữ để dễ đọc hơn."
          checked={prefs.highContrast}
          disabled={saving}
          onChange={(checked) => setPrefs((prev) => ({ ...prev, highContrast: checked }))}
        />
      </SettingsSection>

      <SettingsSection icon={Layout} title="Xem trước">
        <div className="rounded-lg border border-hairline bg-surface-elevated p-4 mx-1">
          <p className="text-sm font-medium text-ink">Thẻ mẫu</p>
          <p className="mt-2 text-sm text-body">
            Đây là ví dụ về cách văn bản và khoảng cách sẽ hiển thị sau khi lưu.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection icon={Contrast} title="Lưu ý">
        <p className="px-1 pb-2 text-sm text-mute">
          Cài đặt giao diện chỉ áp dụng trên trình duyệt hiện tại và không đồng bộ giữa các thiết bị.
        </p>
      </SettingsSection>
    </div>
  );
}
