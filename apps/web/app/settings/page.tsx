"use client";

import Link from "next/link";
import {
  Bell,
  Palette,
  Shield,
  User,
  UserCircle,
  Lock,
  ChevronRight
} from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import { Card } from "../../components/ui/card";

const SECTIONS = [
  {
    href: "/settings/account",
    title: "Tài khoản",
    description: "Email, vai trò, xác minh và thông tin thành viên.",
    icon: User
  },
  {
    href: "/settings/profile",
    title: "Hồ sơ",
    description: "Tên hiển thị, tiêu đề, địa điểm và giới thiệu ngắn.",
    icon: UserCircle
  },
  {
    href: "/settings/notifications",
    title: "Thông báo",
    description: "Email, đẩy thông báo và cảnh báo việc làm.",
    icon: Bell
  },
  {
    href: "/settings/appearance",
    title: "Giao diện",
    description: "Cỡ chữ, chế độ gọn và giảm chuyển động.",
    icon: Palette
  },
  {
    href: "/settings/security",
    title: "Bảo mật",
    description: "Xác minh email, đăng nhập OAuth và phiên làm việc.",
    icon: Lock
  },
  {
    href: "/settings/privacy",
    title: "Quyền riêng tư",
    description: "Ai có thể xem hồ sơ, hoạt động và nhắn tin với bạn.",
    icon: Shield
  }
] as const;

export default function SettingsHubPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <p className="text-sm text-mute">Đang đăng nhập với</p>
        <p className="mt-1 text-lg font-semibold text-ink">{user?.email}</p>
        <p className="mt-1 text-sm capitalize text-mute">{user?.role?.toLowerCase()}</p>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card hover className="flex h-full items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-accent-blue" />
                    <h2 className="font-semibold text-ink">{section.title}</h2>
                  </div>
                  <p className="mt-2 text-sm text-mute">{section.description}</p>
                </div>
                <ChevronRight size={18} className="mt-1 shrink-0 text-mute" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
