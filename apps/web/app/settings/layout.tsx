"use client";

import { ReactNode } from "react";
import { AuthGate } from "../../components/auth-gate";
import { SettingsNav } from "../../components/settings/settings-nav";
import { PageHeader } from "../../components/ui/card";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Cài đặt"
          description="Quản lý tài khoản, hồ sơ, thông báo, giao diện và quyền riêng tư của bạn."
        />
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <SettingsNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </AuthGate>
  );
}
