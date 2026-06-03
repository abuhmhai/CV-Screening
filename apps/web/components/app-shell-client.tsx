"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api-client";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Bell, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const publicNav = [
  { href: "/", label: "Trang chủ" },
  { href: "/jobs", label: "Việc làm" },
  { href: "/search", label: "Tìm kiếm" }
];

const candidateNav = [
  { href: "/applications", label: "Ứng tuyển" },
  { href: "/saved-jobs", label: "Đã lưu" },
  { href: "/feed", label: "Bảng tin" },
  { href: "/network", label: "Mạng lưới" },
  { href: "/messages", label: "Tin nhắn" },
  { href: "/cv-builder", label: "Tạo CV" },
  { href: "/profile", label: "Hồ sơ" }
];

const recruiterNav = [
  { href: "/recruiter/dashboard", label: "Dashboard" },
  { href: "/recruiter/analytics", label: "Analytics" },
  { href: "/recruiter/jobs/new", label: "Đăng tin" },
  { href: "/feed", label: "Bảng tin" },
  { href: "/messages", label: "Tin nhắn" }
];

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/80 ${
        active 
          ? "bg-gradient-to-r from-emerald-400/80 to-emerald-300/80 text-emerald-950 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]" 
          : "text-slate-700 hover:bg-white/40 hover:text-slate-900"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

export function AppShellClient({ children }: { children: ReactNode }) {
  const { user, logout, token, loading } = useAuth();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const roleNav =
    user?.role === "RECRUITER" || user?.role === "ADMIN" ? recruiterNav : candidateNav;

  const isHomePage = pathname === "/";

  return (
    <div className="flex min-h-screen flex-col font-body text-slate-800 bg-[#050b14]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>

      {!isHomePage && (
        <header className="fixed left-0 right-0 top-4 z-50 mx-auto max-w-[1000px] rounded-full border border-white/40 bg-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.6)] backdrop-blur-xl transition-all duration-300">
        <div className="flex items-center justify-between px-4 py-2 md:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-full p-2 text-slate-700 hover:bg-white/40 lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
            >
              <Menu size={24} />
            </button>

            <Link href="/" className="group flex items-center gap-2">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 shadow-[0_2px_10px_rgba(16,185,129,0.4)]">
                <div className="absolute inset-0.5 rounded-full bg-white/20 backdrop-blur-sm"></div>
                <span className="relative z-10 text-xs font-black text-white drop-shadow-md">
                  TF
                </span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-black leading-none text-slate-800 drop-shadow-sm">TalentFlow</div>
                <div className="mt-0.5 text-[10px] font-semibold text-slate-600">AI Recruitment</div>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {publicNav.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
            {!loading && user ? roleNav.map((item) => <NavLink key={item.href} {...item} />) : null}
          </nav>

          <div className="flex items-center gap-2">
            {!loading && user ? (
              <>
                <Link
                  href="/notifications"
                  className="relative rounded-full p-2 text-slate-700 transition-colors hover:bg-white/40"
                  aria-label="Thông báo"
                >
                  <Bell size={18} />
                  {unread > 0 ? (
                    <Badge tone="negative" className="absolute -right-0.5 -top-0.5 min-w-[1.25rem] justify-center px-1 py-0 text-[10px] shadow-sm">
                      {unread}
                    </Badge>
                  ) : null}
                </Link>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-full border border-white/50 bg-white/30 px-1.5 py-1.5 pr-3 shadow-sm transition hover:bg-white/50"
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                  >
                    <Avatar initials={user.email.split("@")[0]} size="sm" className="h-6 w-6" />
                    <span className="hidden max-w-[100px] truncate text-xs font-bold text-slate-700 sm:inline">
                      {user.email.split("@")[0]}
                    </span>
                  </button>

                  <AnimatePresence>
                    {menuOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 mt-2 w-64 rounded-xl border border-ink/10 bg-canvas p-2"
                        role="menu"
                      >
                        <p className="truncate px-3 py-2 text-body-sm font-semibold">{user.email}</p>
                        <p className="px-3 pb-2 text-caption capitalize text-mute">{user.role}</p>
                        <Link
                          href="/profile"
                          className="block rounded-lg px-3 py-2 text-body-sm hover:bg-canvas-soft"
                          onClick={() => setMenuOpen(false)}
                        >
                          Hồ sơ của tôi
                        </Link>
                        <Link
                          href="/settings/privacy"
                          className="block rounded-lg px-3 py-2 text-body-sm hover:bg-canvas-soft"
                          onClick={() => setMenuOpen(false)}
                        >
                          Cài đặt
                        </Link>
                        <button
                          type="button"
                          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-body-sm text-negative hover:bg-negative-bg/10"
                          onClick={() => {
                            logout();
                            setMenuOpen(false);
                          }}
                        >
                          Đăng xuất
                        </button>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link href="/auth/sign-in">
                <div className="rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-1.5 text-xs font-bold text-white shadow-[0_2px_10px_rgba(16,185,129,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] transition-transform hover:scale-105">
                  Đăng nhập
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-2 lg:hidden">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {[...publicNav, ...(user ? roleNav : [])].map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      </header>
      )}

      <AnimatePresence>
        {mobileMenuOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed inset-y-0 left-0 z-50 flex w-4/5 max-w-sm flex-col bg-canvas lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-ink/10 p-4">
                <span className="font-black text-ink">TalentFlow</span>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="rounded-full p-2 hover:bg-canvas-soft">
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {publicNav.map((item) => (
                  <NavLink key={item.href} {...item} onClick={() => setMobileMenuOpen(false)} />
                ))}
                {user
                  ? roleNav.map((item) => (
                      <NavLink key={item.href} {...item} onClick={() => setMobileMenuOpen(false)} />
                    ))
                  : null}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <main id="main-content" className={`mx-auto w-full flex-1 ${isHomePage ? 'p-0' : 'px-4 py-8 sm:px-6 max-w-container'}`}>
        {children}
      </main>

      {!isHomePage && (
        <footer className="mt-auto bg-slate-900 text-slate-300">
        <div className="mx-auto grid max-w-container gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
          <div>
            <p className="text-lg font-black text-canvas">TalentFlow</p>
            <p className="mt-2 text-body-sm text-canvas-soft/70">
              Nền tảng tuyển dụng AI-first kết hợp mạng xã hội nghề nghiệp.
            </p>
          </div>
          <div>
            <p className="text-body-sm font-semibold">Ứng viên</p>
            <ul className="mt-3 space-y-2 text-body-sm text-canvas-soft/70">
              <li>
                <Link href="/jobs" className="hover:text-primary">
                  Tìm việc
                </Link>
              </li>
              <li>
                <Link href="/applications" className="hover:text-primary">
                  Đơn ứng tuyển
                </Link>
              </li>
              <li>
                <Link href="/feed" className="hover:text-primary">
                  Bảng tin
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-body-sm font-semibold">Recruiter</p>
            <ul className="mt-3 space-y-2 text-body-sm text-canvas-soft/70">
              <li>
                <Link href="/recruiter/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/recruiter/jobs/new" className="hover:text-primary">
                  Đăng tin tuyển
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-body-sm font-semibold">Demo</p>
            <p className="mt-3 text-body-sm text-canvas-soft/70">
              Dùng tài khoản demo trên trang đăng nhập để trải nghiệm đầy đủ luồng ứng tuyển + AI score.
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 px-6 py-4 text-center text-caption text-white/50">
          © 2026 TalentFlow - AI Recruitment Platform
        </div>
      </footer>
      )}
    </div>
  );
}
