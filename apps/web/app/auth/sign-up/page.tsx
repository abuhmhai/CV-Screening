"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../lib/auth-context";
import { apiFetch } from "../../../lib/api-client";
import { LoginResponse } from "../../../lib/types";
import { Button } from "../../../components/ui/button";
import { FieldLabel, Input } from "../../../components/ui/input";
import { LoaderOverlay } from "../../../components/ui/loader";
import { motion } from "framer-motion";
import { UserPlus, Eye, EyeOff, Briefcase, User } from "lucide-react";

type Role = "CANDIDATE" | "RECRUITER";

export default function SignUpPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("CANDIDATE");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await apiFetch<LoginResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, fullName, role })
    });

    if (!res.ok || !res.data) {
      setLoading(false);
      setError(res.error ?? "Đăng ký thất bại. Vui lòng thử lại.");
      return;
    }

    // Auto-login after register
    const loginErr = await login(email, password);
    setLoading(false);
    if (loginErr) {
      setError(loginErr);
      return;
    }
    router.push(role === "RECRUITER" ? "/recruiter/dashboard" : "/feed");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-canvas">
      <LoaderOverlay show={loading} label="Đang tạo tài khoản..." />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-positive-deep to-accent-blue text-canvas font-black text-xl shadow-lg mb-4">
            TF
          </div>
          <h1 className="text-3xl font-black text-ink tracking-tight">Tạo tài khoản</h1>
          <p className="mt-2 text-body text-sm">
            Tham gia TalentFlow và khám phá cơ hội nghề nghiệp AI-powered
          </p>
        </div>

        {/* Role Selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole("CANDIDATE")}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
              role === "CANDIDATE"
                ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                : "border-hairline-strong bg-surface-card text-body hover:border-hairline hover:bg-surface-elevated"
            }`}
          >
            <User size={24} />
            <span className="text-sm font-semibold">Ứng viên</span>
            <span className="text-[11px] text-mute text-center leading-tight">Tìm việc & phát triển sự nghiệp</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("RECRUITER")}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
              role === "RECRUITER"
                ? "border-positive-deep bg-positive-deep/10 text-positive-deep"
                : "border-hairline-strong bg-surface-card text-body hover:border-hairline hover:bg-surface-elevated"
            }`}
          >
            <Briefcase size={24} />
            <span className="text-sm font-semibold">Nhà tuyển dụng</span>
            <span className="text-[11px] text-mute text-center leading-tight">Đăng tin & tuyển nhân tài</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-hairline-strong bg-surface-card p-6 shadow-xl space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FieldLabel label="Họ và tên">
              <Input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </FieldLabel>

            <FieldLabel label="Email">
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FieldLabel>

            <FieldLabel label="Mật khẩu">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-mute hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FieldLabel>

            <FieldLabel label="Xác nhận mật khẩu">
              <Input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </FieldLabel>

            {error ? (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-negative/10 border border-negative/20 px-3 py-2 text-sm text-negative"
              >
                {error}
              </motion.p>
            ) : null}

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              leftIcon={<UserPlus size={16} />}
              className="mt-2"
            >
              {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-body">
          Đã có tài khoản?{" "}
          <Link href="/auth/sign-in" className="font-semibold text-accent-blue hover:underline">
            Đăng nhập ngay
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
