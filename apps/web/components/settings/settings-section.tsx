"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "../ui/card";

export function SettingsSection({
  icon: Icon,
  title,
  children,
  footer
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="space-y-1 p-2">
      <div className="flex items-center gap-2 border-b border-hairline px-3 py-3">
        <Icon size={18} className="text-accent-blue" />
        <p className="text-sm font-medium text-ink">{title}</p>
      </div>
      <div className="space-y-2 p-2">{children}</div>
      {footer}
    </Card>
  );
}
