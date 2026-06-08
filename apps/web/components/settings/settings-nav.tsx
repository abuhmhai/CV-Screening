"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  LayoutGrid,
  Palette,
  Shield,
  User,
  UserCircle,
  Lock
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/settings", label: "Tổng quan", icon: LayoutGrid, exact: true },
  { href: "/settings/account", label: "Tài khoản", icon: User },
  { href: "/settings/profile", label: "Hồ sơ", icon: UserCircle },
  { href: "/settings/notifications", label: "Thông báo", icon: Bell },
  { href: "/settings/appearance", label: "Giao diện", icon: Palette },
  { href: "/settings/security", label: "Bảo mật", icon: Lock },
  { href: "/settings/privacy", label: "Quyền riêng tư", icon: Shield }
] as const;

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1" aria-label="Cài đặt">
      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-surface-elevated text-ink"
                : "text-mute hover:bg-surface-elevated hover:text-ink"
            }`}
          >
            <Icon size={18} className={active ? "text-accent-blue" : undefined} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
