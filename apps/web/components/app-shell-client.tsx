"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api-client";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

const publicNav = [
  { href: "/", label: "Trang chủ" },
  { href: "/jobs", label: "Việc làm" },
  { href: "/search", label: "Search" }
];

const candidateNav = [
  { href: "/onboarding", label: "Onboarding" },
  { href: "/applications", label: "Ứng tuyển" },
  { href: "/feed", label: "Bảng tin" },
  { href: "/network", label: "Mạng lưới" },
  { href: "/messages", label: "Tin nhắn" },
  { href: "/notifications", label: "Thông báo" },
  { href: "/profile", label: "Hồ sơ" },
  { href: "/settings/privacy", label: "Privacy" }
];

const recruiterNav = [
  { href: "/recruiter/dashboard", label: "Dashboard" },
  { href: "/recruiter/analytics", label: "Analytics" },
  { href: "/recruiter/jobs/new", label: "Đăng tin" },
  { href: "/feed", label: "Bảng tin" },
  { href: "/messages", label: "Tin nhắn" },
  { href: "/notifications", label: "Thông báo" },
  { href: "/settings/privacy", label: "Privacy" }
];

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`rounded-pill px-3 py-2 text-sm font-semibold transition ${
        active ? "bg-primary text-ink" : "text-ink hover:bg-primary-pale"
      }`}
    >
      {label}
    </Link>
  );
}

export function AppShellClient({ children }: { children: ReactNode }) {
  const { user, logout, token, loading } = useAuth();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [onboardingCompletion, setOnboardingCompletion] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!token) {
      setUnread(0);
      return;
    }
    void apiFetch<Array<{ isRead: boolean }>>("/notifications", { token }).then((res) => {
      if (res.ok && res.data) {
        setUnread(res.data.filter((n) => !n.isRead).length);
      }
    });
  }, [token, pathname]);

  useEffect(() => {
    if (!token || !user || user.role !== "CANDIDATE") {
      setOnboardingCompletion(null);
      return;
    }
    void apiFetch<{ completion: number }>("/users/me/onboarding-checklist", { token }).then((res) => {
      if (res.ok && res.data) {
        setOnboardingCompletion(res.data.completion);
      }
    });
  }, [token, pathname, user]);

  const roleNav =
    user?.role === "RECRUITER" || user?.role === "ADMIN" ? recruiterNav : candidateNav;

  return (
    <div className="flex min-h-screen flex-col bg-canvas-soft text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-black">
              AI
            </span>
            <div>
              <div className="text-sm font-black leading-none">TalentFlow</div>
              <div className="text-xs text-mute">Recruit smarter</div>
            </div>
          </Link>

          <nav className="hidden flex-wrap items-center gap-1 lg:flex">
            {publicNav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
            {!loading && user
              ? roleNav.map((item) => (
                  <NavLink key={item.href} {...item} />
                ))
              : null}
          </nav>

          <div className="flex items-center gap-2">
            {!loading && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl border border-ink/10 bg-canvas px-3 py-2 transition hover:bg-canvas-soft"
                >
                  <Avatar name={user.email.split("@")[0]} email={user.email} size="sm" />
                  <span className="hidden text-sm font-semibold sm:inline">{user.email}</span>
                  {unread > 0 ? <Badge tone="negative">{unread}</Badge> : null}
                  {typeof onboardingCompletion === "number" && onboardingCompletion < 100 ? (
                    <Badge tone="warning">{onboardingCompletion}%</Badge>
                  ) : null}
                </button>
                {menuOpen ? (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-ink/10 bg-canvas p-2 shadow-lg">
                    <p className="px-3 py-2 text-xs text-mute">{user.role}</p>
                    <Link
                      href="/profile"
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-canvas-soft"
                      onClick={() => setMenuOpen(false)}
                    >
                      Hồ sơ của tôi
                    </Link>
                    <Link
                      href="/notifications"
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-canvas-soft"
                      onClick={() => setMenuOpen(false)}
                    >
                      Thông báo {unread > 0 ? `(${unread})` : ""}
                    </Link>
                    <button
                      type="button"
                      className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-negative hover:bg-negative/10"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <Link href="/auth/sign-in">
                <Button variant="secondary" className="px-4 py-2 text-sm">
                  Đăng nhập
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-ink/5 px-6 py-2 lg:hidden">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {[...publicNav, ...(user ? roleNav : [])].map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        {children}
      </main>

      <footer className="mt-auto border-t border-ink/10 bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-4">
          <div>
            <p className="text-lg font-black">TalentFlow</p>
            <p className="mt-2 text-sm text-white/70">
              Nền tảng tuyển dụng AI-first kết hợp mạng xã hội nghề nghiệp.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Ứng viên</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link href="/jobs" className="hover:text-primary">Tìm việc</Link></li>
              <li><Link href="/applications" className="hover:text-primary">Đơn ứng tuyển</Link></li>
              <li><Link href="/feed" className="hover:text-primary">Bảng tin</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Recruiter</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li><Link href="/recruiter/dashboard" className="hover:text-primary">Dashboard</Link></li>
              <li><Link href="/recruiter/jobs/new" className="hover:text-primary">Đăng tin tuyển</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Demo</p>
            <p className="mt-3 text-sm text-white/70">
              Dùng tài khoản demo trên trang đăng nhập để trải nghiệm đầy đủ luồng ứng tuyển + AI score.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/50">
          © 2026 TalentFlow — AI Recruitment Platform
        </div>
      </footer>
    </div>
  );
}
