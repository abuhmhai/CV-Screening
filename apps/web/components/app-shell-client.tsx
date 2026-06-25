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
  { href: "/external-jobs", label: "Việc làm tổng hợp" },
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
      className={`whitespace-nowrap px-3 py-1.5 text-button-sm transition-all focus-visible:ring-1 focus-visible:ring-hairline-strong rounded-md ${
        active
          ? "text-ink bg-surface-elevated border border-hairline-strong"
          : "text-body hover:text-ink hover:bg-surface-card"
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
    <div className={`flex min-h-screen flex-col font-marketing bg-canvas text-ink`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-on"
      >
        Skip to content
      </a>

      {!isHomePage && (
        <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-hairline bg-canvas/90 backdrop-blur-md transition-all duration-300">
          <div className="mx-auto flex h-16 max-w-container items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4 shrink-0">
              <button
                type="button"
                className="rounded-md p-2 text-body hover:bg-surface-card hover:text-ink xl:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Mở menu"
              >
                <Menu size={24} />
              </button>

              <Link href="/" className="group flex items-center gap-2">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-surface-elevated border border-hairline-strong transition-transform group-hover:scale-105">
                  <span className="relative z-10 text-xs font-black text-ink">TF</span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-bold leading-none text-ink tracking-tight">TalentFlow</div>
                </div>
              </Link>
            </div>

            <nav className="hidden items-center gap-1 xl:flex">
              {publicNav.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
              {!loading && user ? roleNav.map((item) => <NavLink key={item.href} {...item} />) : null}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {!loading && user ? (
                <>
                  <Link
                    href="/notifications"
                    className="relative rounded-md p-2 text-body transition-colors hover:bg-surface-card hover:text-ink"
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
                      className="flex items-center gap-2 rounded-full border border-hairline-strong bg-surface-card px-1.5 py-1.5 pr-3 transition hover:bg-surface-elevated"
                      aria-expanded={menuOpen}
                      aria-haspopup="menu"
                    >
                      <Avatar initials={user.email.split("@")[0]} size="sm" className="h-6 w-6" />
                      <span className="hidden max-w-[100px] truncate text-xs font-medium text-ink sm:inline">
                        {user.email.split("@")[0]}
                      </span>
                    </button>

                    <AnimatePresence>
                      {menuOpen ? (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          className="absolute right-0 mt-2 w-64 rounded-xl border border-hairline-strong bg-surface-card p-2 shadow-[0_16px_48px_rgba(0,0,0,0.4)]"
                          role="menu"
                        >
                          <p className="truncate px-3 py-2 text-body-sm font-medium">{user.email}</p>
                          <p className="px-3 pb-2 text-caption capitalize text-mute">{user.role}</p>
                          <Link
                            href="/profile"
                            className="block rounded-lg px-3 py-2 text-body-sm hover:bg-surface-elevated"
                            onClick={() => setMenuOpen(false)}
                          >
                            Hồ sơ của tôi
                          </Link>
                          <Link
                            href="/settings"
                            className="block rounded-lg px-3 py-2 text-body-sm hover:bg-surface-elevated"
                            onClick={() => setMenuOpen(false)}
                          >
                            Cài đặt
                          </Link>
                          <button
                            type="button"
                            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-body-sm text-negative hover:bg-surface-elevated"
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
                  <Button variant="primary">Đăng nhập</Button>
                </Link>
              )}
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
              className="fixed inset-0 z-40 bg-canvas/80 backdrop-blur-sm xl:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ ease: "easeOut", duration: 0.2 }}
              className="fixed inset-y-0 left-0 z-50 flex w-4/5 max-w-sm flex-col border-r border-hairline-strong bg-canvas xl:hidden"
            >
              <div className="flex items-center justify-between border-b border-hairline-strong p-4">
                <span className="font-bold text-ink">TalentFlow</span>
                <button type="button" onClick={() => setMobileMenuOpen(false)} className="rounded-md p-2 hover:bg-surface-card">
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

      <main id="main-content" className={`mx-auto w-full flex-1 ${isHomePage ? 'p-0' : 'px-4 pb-16 pt-24 sm:px-6 max-w-container animate-fade-up'}`}>
        {children}
      </main>

      {!isHomePage && (
        <footer className="mt-auto bg-canvas border-t border-hairline-strong">
          <div className="mx-auto grid max-w-container gap-8 px-4 py-16 sm:px-6 md:grid-cols-4">
            <div>
              <p className="text-lg font-bold text-ink">TalentFlow</p>
              <p className="mt-2 text-body-sm text-body">
                Nền tảng tuyển dụng AI-first kết hợp mạng xã hội nghề nghiệp.
              </p>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-ink">Ứng viên</p>
              <ul className="mt-4 space-y-3 text-body-sm text-body">
                <li>
                  <Link href="/jobs" className="hover:text-primary transition-colors">
                    Tìm việc
                  </Link>
                </li>
                <li>
                  <Link href="/applications" className="hover:text-primary transition-colors">
                    Đơn ứng tuyển
                  </Link>
                </li>
                <li>
                  <Link href="/feed" className="hover:text-primary transition-colors">
                    Bảng tin
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-ink">Recruiter</p>
              <ul className="mt-4 space-y-3 text-body-sm text-body">
                <li>
                  <Link href="/recruiter/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/recruiter/jobs/new" className="hover:text-primary transition-colors">
                    Đăng tin tuyển
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-ink">Demo</p>
              <p className="mt-4 text-body-sm text-body">
                Dùng tài khoản demo trên trang đăng nhập để trải nghiệm đầy đủ luồng ứng tuyển + AI score.
              </p>
            </div>
          </div>
          <div className="border-t border-divider-soft px-6 py-6 text-center text-caption text-mute">
            © 2026 TalentFlow - AI Recruitment Platform
          </div>
        </footer>
      )}
    </div>
  );
}
