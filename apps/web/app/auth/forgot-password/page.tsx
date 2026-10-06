"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../../../lib/api-client";
import { Button } from "../../../components/ui/button";
import { FieldLabel, Input } from "../../../components/ui/input";
import { LoaderOverlay } from "../../../components/ui/loader";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, CheckCircle2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email && !phone) {
      setError("Vui lòng nhập email hoặc số điện thoại");
      return;
    }
    setLoading(true);
    setError(null);

    // Request password reset — API endpoint may vary; we submit what we have
    const res = await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: email || undefined, phone: phone || undefined })
    });

    setLoading(false);
    if (!res.ok) {
      // Even if endpoint doesn't exist yet, show success (to prevent email enumeration)
      // but we still show a message
      setError(res.error ?? "Gửi yêu cầu thất bại, thử lại sau.");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-canvas">
      <LoaderOverlay show={loading} label="Đang gửi yêu cầu..." />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-warning/80 to-accent-orange text-canvas font-black text-xl shadow-lg mb-4">
            <KeyRound size={28} />
          </div>
          <h1 className="text-3xl font-black text-ink tracking-tight">Quên mật khẩu?</h1>
          <p className="mt-2 text-body text-sm">
            Nhập email hoặc số điện thoại để lấy lại mật khẩu
          </p>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-positive/30 bg-positive/10 p-8 text-center"
            >
              <CheckCircle2 size={48} className="mx-auto text-positive mb-4" />
              <h2 className="text-xl font-bold text-ink mb-2">Yêu cầu đã gửi!</h2>
              <p className="text-body text-sm mb-6">
                Yêu cầu của bạn đã được chuyển đến quản trị viên. Quản trị viên sẽ kiểm tra thông tin và hỗ trợ khôi phục tài khoản.
              </p>
              <Link href="/auth/sign-in">
                <Button variant="secondary" leftIcon={<ArrowLeft size={16} />}>
                  Quay lại đăng nhập
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="rounded-2xl border border-hairline-strong bg-surface-card p-6 shadow-xl space-y-4">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <FieldLabel label="Email">
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
                    </div>
                  </FieldLabel>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-hairline" />
                    <span className="text-xs text-mute font-medium">HOẶC</span>
                    <div className="flex-1 h-px bg-hairline" />
                  </div>

                  <FieldLabel label="Số điện thoại">
                    <Input
                      type="tel"
                      placeholder="0901 234 567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
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
                    disabled={loading || (!email && !phone)}
                    leftIcon={<KeyRound size={16} />}
                    className="mt-2"
                  >
                    {loading ? "Đang gửi..." : "Gửi yêu cầu lấy lại mật khẩu"}
                  </Button>
                </form>
              </div>

              <p className="mt-6 text-center text-sm text-body">
                Nhớ mật khẩu rồi?{" "}
                <Link href="/auth/sign-in" className="font-semibold text-accent-blue hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
