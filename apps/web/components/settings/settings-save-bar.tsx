"use client";

import { ReactNode } from "react";
import { Button } from "../ui/button";

export function SettingsSaveBar({
  hasChanges,
  saving,
  onCancel,
  onSave,
  leftSlot
}: {
  hasChanges: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
  leftSlot?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline px-3 py-4">
      <div className="min-w-0">{leftSlot}</div>
      <div className="flex gap-2">
        <Button variant="ghost" disabled={!hasChanges || saving} onClick={onCancel}>
          Huỷ thay đổi
        </Button>
        <Button onClick={onSave} disabled={!hasChanges || saving}>
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </Button>
      </div>
    </div>
  );
}
