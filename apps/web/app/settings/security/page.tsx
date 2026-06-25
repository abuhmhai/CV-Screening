"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { KeyRound, Link2, Lock, ShieldAlert } from "lucide-react";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch, getApiBase } from "../../../lib/api-client";
import { SettingsSection } from "../../../components/settings/settings-section";
import { Button } from "../../../components/ui/button";
import { LoadingBlock } from "../../../components/ui/states";

export default function SecuritySettingsPage() {
  const { user, token, refreshUser } = useAuth();
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
    } else {
      toast.error(res.error ?? "Không gửi được yêu cầu xác minh");
    }
  };

  const oauthUrl = (provider: "google" | "linkedin") =>
    `${getApiBase()}/api/v1/auth/${provider}`;

  if (loading) return <LoadingBlock label="Đang tải bảo mật..." />;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Bảo mật</h2>
        <p className="mt-1 text-sm text-mute">Bảo vệ tài khoản và kiểm soát cách bạn đăng nhập.</p>
      </div>

      <SettingsSection icon={KeyRound} title="Xác minh email">
        <div className="rounded-lg border border-hairline bg-surface-elevated p-4 mx-1">
          <p className="text-sm text-body">
            Trạng thái:{" "}
            <span className="font-medium text-ink">
              {user?.isVerified ? "Đã xác minh" : "Chưa xác minh"}
            </span>
          </p>
          {!user?.isVerified ? (
            <Button
              className="mt-3"
              variant="secondary"
              isLoading={verifying}
              onClick={requestVerification}
            >
              Gửi lại email xác minh
            </Button>
          ) : (
            <p className="mt-2 text-sm text-mute">Email {user?.email} đã được xác minh.</p>
          )}
        </div>
      </SettingsSection>

      <SettingsSection icon={Link2} title="Đăng nhập xã hội">
        <p className="px-1 text-sm text-mute">
          Liên kết Google hoặc LinkedIn để đăng nhập nhanh hơn (cần cấu hình OAuth trên máy chủ).
        </p>
        <div className="flex flex-wrap gap-3 px-1 pb-2">
          <a href={oauthUrl("google")}>
            <Button variant="secondary">Tiếp tục với Google</Button>
          </a>
          <a href={oauthUrl("linkedin")}>
            <Button variant="ghost">Tiếp tục với LinkedIn</Button>
          </a>
        </div>
      </SettingsSection>

      <SettingsSection icon={Lock} title="Mật khẩu">
        <div className="rounded-lg border border-hairline bg-surface-elevated p-4 mx-1">
          <p className="text-sm text-body">
            Đổi mật khẩu chưa khả dụng trong phiên bản này. Liên hệ quản trị viên nếu cần hỗ trợ.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection icon={ShieldAlert} title="Quyền riêng tư & dữ liệu">
        <div className="flex flex-wrap gap-3 px-1 pb-2">
          <Link href="/settings/privacy">
            <Button variant="secondary">Cài đặt quyền riêng tư</Button>
          </Link>
          <Link href="/settings/account">
            <Button variant="ghost">Thông tin tài khoản</Button>
          </Link>
        </div>
      </SettingsSection>
    </div>
  );
}
