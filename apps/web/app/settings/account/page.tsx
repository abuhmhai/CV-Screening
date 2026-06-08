"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BadgeCheck, Calendar, Mail, ShieldCheck, User } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { SettingsSection } from "../../../components/settings/settings-section";
import { Button } from "../../../components/ui/button";
import { LoadingBlock } from "../../../components/ui/states";

const ROLE_LABELS: Record<string, string> = {
  CANDIDATE: "Ứng viên",
  RECRUITER: "Nhà tuyển dụng",
  ADMIN: "Quản trị viên"
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export default function AccountSettingsPage() {
  const { user, token, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!token) return;
    void refreshUser().finally(() => setLoading(false));
  }, [token, refreshUser]);

  const requestVerification = async () => {
    if (!token) return;
    setVerifying(true);
    const res = await apiFetch<{ token: string }>("/auth/request-verification", {
      method: "POST",
      token
    });
    setVerifying(false);
    if (res.ok) {
      toast.success("Đã gửi yêu cầu xác minh email");
      if (res.data?.token) {
        toast.message("Token dev", { description: res.data.token.slice(0, 24) + "…" });
      }
    } else {
      toast.error(res.error ?? "Không gửi được yêu cầu xác minh");
    }
  };

  if (loading) return <LoadingBlock label="Đang tải tài khoản..." />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Tài khoản</h2>
        <p className="mt-1 text-sm text-mute">Thông tin đăng nhập và trạng thái tài khoản.</p>
      </div>

      <SettingsSection icon={User} title="Thông tin cơ bản">
        <div className="space-y-4 px-1">
          <div className="flex items-start gap-3 rounded-lg border border-hairline bg-surface-elevated p-4">
            <Mail size={18} className="mt-0.5 text-accent-blue" />
            <div>
              <p className="text-sm font-medium text-ink">Email</p>
              <p className="mt-1 text-sm text-body">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-hairline bg-surface-elevated p-4">
            <ShieldCheck size={18} className="mt-0.5 text-accent-blue" />
            <div>
              <p className="text-sm font-medium text-ink">Vai trò</p>
              <p className="mt-1 text-sm text-body">
                {user?.role ? ROLE_LABELS[user.role] ?? user.role : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-hairline bg-surface-elevated p-4">
            <Calendar size={18} className="mt-0.5 text-accent-blue" />
            <div>
              <p className="text-sm font-medium text-ink">Tham gia từ</p>
              <p className="mt-1 text-sm text-body">{formatDate(user?.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-hairline bg-surface-elevated p-4">
            <BadgeCheck size={18} className="mt-0.5 text-accent-blue" />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">Xác minh email</p>
              <p className="mt-1 text-sm text-body">
                {user?.isVerified ? "Đã xác minh" : "Chưa xác minh"}
              </p>
              {!user?.isVerified ? (
                <Button
                  className="mt-3"
                  variant="secondary"
                  isLoading={verifying}
                  onClick={requestVerification}
                >
                  Gửi email xác minh
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection icon={User} title="Hành động tài khoản">
        <div className="flex flex-wrap gap-3 px-1 pb-2">
          <Link href="/profile">
            <Button variant="secondary">Xem hồ sơ đầy đủ</Button>
          </Link>
          <Link href="/settings/security">
            <Button variant="ghost">Cài đặt bảo mật</Button>
          </Link>
          <Button variant="danger" onClick={logout}>
            Đăng xuất
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}
