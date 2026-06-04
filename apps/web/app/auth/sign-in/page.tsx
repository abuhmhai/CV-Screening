"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-context";
import { demoAccounts } from "../../../lib/demo-accounts";
import { Card, PageHeader } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { FieldLabel, Input } from "../../../components/ui/input";
import { LoaderOverlay } from "../../../components/ui/loader";

export default function SignInPage() {
  const { login, demoLogin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const err = await login(email, password);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/");
  }

  async function handleDemo(accountEmail: string) {
    setLoading(true);
    setError(null);
    const err = await demoLogin(accountEmail);
    setLoading(false);
    if (err) {
      setError(err);
      return;
    }
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <LoaderOverlay show={loading} label="Đang đăng nhập..." />
      <PageHeader
        title="Đăng nhập"
        description="Dùng email/password hoặc chọn tài khoản demo để trải nghiệm đầy đủ tính năng."
      />

      <Card>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FieldLabel label="Email">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FieldLabel>
          <FieldLabel label="Password">
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </FieldLabel>
          {error ? <p className="text-sm text-negative">{error}</p> : null}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold">Tài khoản demo nhanh</h2>
        <p className="mt-1 text-sm text-body">Click để đăng nhập không cần nhập mật khẩu.</p>
        <div className="mt-4 space-y-2">
          {demoAccounts.map((account) => (
            <button
              key={account.email}
              type="button"
              disabled={loading}
              onClick={() => handleDemo(account.email)}
              className="flex w-full items-center justify-between rounded-xl border border-hairline-strong bg-surface-card px-4 py-3 text-left transition hover:bg-surface-elevated"
            >
              <span className="text-sm font-semibold">{account.label}</span>
              <span className="text-xs text-mute">{account.role}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
