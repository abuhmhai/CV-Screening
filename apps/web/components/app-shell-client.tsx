"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../lib/auth-context";
import { apiFetch } from "../lib/api-client";
import { Avatar } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Bell,
  Menu,
  X,
  ChevronDown,
  Briefcase,
  Globe2,
  Bookmark,
  FileCheck,
  FileText,
  Target,
  Search,
  Rss,
  Users,
  MessageSquare,
  LayoutDashboard,
  BarChart3,
  PlusCircle,
  User,
  Settings,
  LogOut,
  Sparkles,
  Home
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "./ui/theme-toggle";

export function AppShellClient({ children }: { children: ReactNode }) {
  const { user, logout, token, loading } = useAuth();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  // Dropdown states
  const [jobsDropdownOpen, setJobsDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);

  // Close all dropdowns on outside click or route change
  useEffect(() => {
    setJobsDropdownOpen(false);
    setToolsDropdownOpen(false);
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setJobsDropdownOpen(false);
        setToolsDropdownOpen(false);
        setProfileMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setJobsDropdownOpen(false);
        setToolsDropdownOpen(false);
        setProfileMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Notifications poll
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

  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";
  const isHomePage = pathname === "/";

  // Check active states
  const isJobsActive =
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/external-jobs") ||
    pathname.startsWith("/saved-jobs") ||
    pathname.startsWith("/applications");

  const isToolsActive =
    pathname.startsWith("/cv-builder") ||
    pathname.startsWith("/goals") ||
    pathname.startsWith("/search");

  return (
    <div className="flex min-h-screen flex-col font-marketing bg-canvas text-ink" ref={navRef}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-on"
      >
        Skip to content
      </a>

      {!isHomePage && (
        <header className="fixed left-0 right-0 top-0 z-50 w-full border-b border-hairline bg-canvas/90 backdrop-blur-md transition-all duration-300">
          <div className="mx-auto flex h-16 max-w-container items-center justify-between px-4 sm:px-6">
            {/* Logo & Mobile Menu Button */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                className="rounded-lg p-2 text-body transition hover:bg-surface-card hover:text-ink lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Mở menu"
              >
                <Menu size={22} />
              </button>

              <Link href={user ? (isRecruiter ? "/recruiter/dashboard" : "/feed") : "/"} className="group flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-deep text-ink font-black text-sm shadow-sm transition-transform group-hover:scale-105">
                  TF
                </div>
                <div className="hidden sm:block">
                  <div className="text-[15px] font-extrabold leading-none text-ink tracking-tight">TalentFlow</div>
                  <div className="text-[10px] text-mute font-medium leading-tight mt-0.5">AI Recruitment</div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 lg:flex">
              {/* If NOT logged in (Guest Nav) */}
              {!loading && !user && (
                <>
                  <Link
                    href="/"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <Home size={16} className="text-mute" />
                    <span>Trang chủ</span>
                  </Link>
                  <Link
                    href="/jobs"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/jobs" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <Briefcase size={16} className="text-mute" />
                    <span>Việc làm</span>
                  </Link>
                  <Link
                    href="/external-jobs"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/external-jobs" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <Globe2 size={16} className="text-mute" />
                    <span>Việc làm tổng hợp</span>
                    <span className="ml-1 rounded-full bg-primary/20 px-1.5 py-0.2 text-[10px] font-bold text-positive-deep">
                      4 nguồn
                    </span>
                  </Link>
                  <Link
                    href="/search"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/search" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <Search size={16} className="text-mute" />
                    <span>Tìm kiếm</span>
                  </Link>
                </>
              )}

              {/* If Logged in as Candidate */}
              {!loading && user && !isRecruiter && (
                <>
                  <Link
                    href="/feed"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/feed" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <Rss size={16} className={pathname === "/feed" ? "text-primary" : "text-mute"} />
                    <span>Bảng tin</span>
                  </Link>

                  <Link
                    href="/network"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/network" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <Users size={16} className={pathname === "/network" ? "text-primary" : "text-mute"} />
                    <span>Mạng lưới</span>
                  </Link>

                  {/* Việc làm Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setJobsDropdownOpen((v) => !v);
                        setToolsDropdownOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                        isJobsActive
                          ? "bg-surface-elevated text-ink font-semibold border border-hairline"
                          : "text-body hover:text-ink hover:bg-surface-card"
                      }`}
                    >
                      <Briefcase size={16} className={isJobsActive ? "text-primary" : "text-mute"} />
                      <span>Việc làm</span>
                      <ChevronDown size={14} className={`text-mute transition-transform ${jobsDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {jobsDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-2 w-72 rounded-2xl border border-hairline-strong bg-surface-card p-2 shadow-2xl z-50"
                        >
                          <Link
                            href="/jobs"
                            onClick={() => setJobsDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-surface-elevated text-ink"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-ink">
                              <Briefcase size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-body-sm font-semibold">Việc làm tuyển dụng</div>
                              <div className="text-caption text-mute truncate">Tin tuyển trực tiếp trên TalentFlow</div>
                            </div>
                          </Link>

                          <Link
                            href="/external-jobs"
                            onClick={() => setJobsDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-surface-elevated text-ink"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-pale text-positive-deep">
                              <Globe2 size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-body-sm font-semibold">Việc làm tổng hợp</span>
                                <span className="rounded-full bg-primary/30 px-1.5 py-0.2 text-[10px] font-bold text-positive-deep">
                                  4 Nguồn
                                </span>
                              </div>
                              <div className="text-caption text-mute truncate">TopCV, ITviec, CareerViet, VNW</div>
                            </div>
                          </Link>

                          <div className="my-1 border-t border-hairline" />

                          <Link
                            href="/saved-jobs"
                            onClick={() => setJobsDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-surface-elevated text-ink"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-mute">
                              <Bookmark size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-body-sm font-semibold">Việc làm đã lưu</div>
                              <div className="text-caption text-mute truncate">Danh sách tin đã bookmark</div>
                            </div>
                          </Link>

                          <Link
                            href="/applications"
                            onClick={() => setJobsDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-surface-elevated text-ink"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-mute">
                              <FileCheck size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="text-body-sm font-semibold">Đơn ứng tuyển</div>
                              <div className="text-caption text-mute truncate">Theo dõi tiến độ hồ sơ đã nộp</div>
                            </div>
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Link
                    href="/messages"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/messages" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <MessageSquare size={16} className={pathname === "/messages" ? "text-primary" : "text-mute"} />
                    <span>Tin nhắn</span>
                  </Link>

                  {/* Công cụ Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setToolsDropdownOpen((v) => !v);
                        setJobsDropdownOpen(false);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                        isToolsActive
                          ? "bg-surface-elevated text-ink font-semibold border border-hairline"
                          : "text-body hover:text-ink hover:bg-surface-card"
                      }`}
                    >
                      <Sparkles size={16} className={isToolsActive ? "text-primary" : "text-mute"} />
                      <span>Công cụ</span>
                      <ChevronDown size={14} className={`text-mute transition-transform ${toolsDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {toolsDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-2 w-64 rounded-2xl border border-hairline-strong bg-surface-card p-2 shadow-2xl z-50"
                        >
                          <Link
                            href="/cv-builder"
                            onClick={() => setToolsDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-surface-elevated text-ink"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-ink">
                              <FileText size={18} />
                            </div>
                            <div>
                              <div className="text-body-sm font-semibold">Tạo CV với AI</div>
                              <div className="text-caption text-mute">Thiết kế CV chuẩn ATS</div>
                            </div>
                          </Link>

                          <Link
                            href="/goals"
                            onClick={() => setToolsDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-surface-elevated text-ink"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-ink">
                              <Target size={18} />
                            </div>
                            <div>
                              <div className="text-body-sm font-semibold">Mục tiêu nghề nghiệp</div>
                              <div className="text-caption text-mute">Lộ trình thăng tiến cá nhân</div>
                            </div>
                          </Link>

                          <Link
                            href="/search"
                            onClick={() => setToolsDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-surface-elevated text-ink"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-elevated text-ink">
                              <Search size={18} />
                            </div>
                            <div>
                              <div className="text-body-sm font-semibold">Tìm kiếm thông minh</div>
                              <div className="text-caption text-mute">Tra cứu ứng viên & việc làm</div>
                            </div>
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* If Logged in as Recruiter */}
              {!loading && user && isRecruiter && (
                <>
                  <Link
                    href="/recruiter/dashboard"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/recruiter/dashboard" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <LayoutDashboard size={16} className={pathname === "/recruiter/dashboard" ? "text-primary" : "text-mute"} />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/recruiter/jobs/new"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/recruiter/jobs/new" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <PlusCircle size={16} className={pathname === "/recruiter/jobs/new" ? "text-primary" : "text-mute"} />
                    <span>Đăng tin</span>
                  </Link>

                  <Link
                    href="/recruiter/analytics"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/recruiter/analytics" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <BarChart3 size={16} className={pathname === "/recruiter/analytics" ? "text-primary" : "text-mute"} />
                    <span>Analytics</span>
                  </Link>

                  <Link
                    href="/feed"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/feed" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <Rss size={16} className={pathname === "/feed" ? "text-primary" : "text-mute"} />
                    <span>Bảng tin</span>
                  </Link>

                  <Link
                    href="/network"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/network" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <Users size={16} className={pathname === "/network" ? "text-primary" : "text-mute"} />
                    <span>Mạng lưới</span>
                  </Link>

                  <Link
                    href="/messages"
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-body-sm font-medium rounded-lg transition-all ${
                      pathname === "/messages" ? "bg-surface-elevated text-ink font-semibold border border-hairline" : "text-body hover:text-ink hover:bg-surface-card"
                    }`}
                  >
                    <MessageSquare size={16} className={pathname === "/messages" ? "text-primary" : "text-mute"} />
                    <span>Tin nhắn</span>
                  </Link>
                </>
              )}
            </nav>

            {/* Right Tools (Theme, Notifications, Profile) */}
            <div className="flex items-center gap-2.5 shrink-0">
              <ThemeToggle />

              {!loading && user ? (
                <>
                  <Link
                    href="/notifications"
                    className="relative rounded-xl p-2 text-body transition-colors hover:bg-surface-card hover:text-ink border border-transparent hover:border-hairline"
                    aria-label="Thông báo"
                  >
                    <Bell size={19} />
                    {unread > 0 ? (
                      <Badge tone="negative" className="absolute -right-1 -top-1 min-w-[1.2rem] justify-center px-1 py-0 text-[10px] font-bold shadow-sm">
                        {unread}
                      </Badge>
                    ) : null}
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((v) => !v)}
                      className="flex items-center gap-2 rounded-full border border-hairline-strong bg-surface-card p-1 pr-2.5 transition hover:bg-surface-elevated shadow-xs"
                      aria-expanded={profileMenuOpen}
                      aria-haspopup="menu"
                    >
                      <Avatar initials={user.email.split("@")[0]} size="sm" className="h-7 w-7 text-xs font-bold" />
                      <span className="hidden max-w-[100px] truncate text-body-sm font-medium text-ink sm:inline">
                        {user.email.split("@")[0]}
                      </span>
                      <ChevronDown size={14} className={`text-mute transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
                    </button>

                    <AnimatePresence>
                      {profileMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 mt-2 w-64 rounded-2xl border border-hairline-strong bg-surface-card p-2 shadow-2xl z-50"
                          role="menu"
                        >
                          <div className="px-3 py-2.5 border-b border-hairline mb-1">
                            <p className="truncate text-body-sm font-bold text-ink">{user.email}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span
                                className={`rounded-pill px-2 py-0.5 text-[11px] font-bold ${
                                  isRecruiter
                                    ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400"
                                }`}
                              >
                                {isRecruiter ? "Nhà tuyển dụng" : "Ứng viên"}
                              </span>
                            </div>
                          </div>

                          <Link
                            href="/profile"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-body-sm text-body transition hover:bg-surface-elevated hover:text-ink"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <User size={16} className="text-mute" />
                            <span>Hồ sơ của tôi</span>
                          </Link>

                          <Link
                            href="/settings"
                            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-body-sm text-body transition hover:bg-surface-elevated hover:text-ink"
                            onClick={() => setProfileMenuOpen(false)}
                          >
                            <Settings size={16} className="text-mute" />
                            <span>Cài đặt tài khoản</span>
                          </Link>

                          <div className="my-1 border-t border-hairline" />

                          <button
                            type="button"
                            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-body-sm text-negative transition hover:bg-negative/10"
                            onClick={() => {
                              logout();
                              setProfileMenuOpen(false);
                            }}
                          >
                            <LogOut size={16} />
                            <span>Đăng xuất</span>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <Link href="/auth/sign-in">
                  <Button variant="primary" className="rounded-xl px-4 py-2 font-bold shadow-xs">
                    Đăng nhập
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>
      )}

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ ease: "easeOut", duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 flex w-4/5 max-w-sm flex-col border-r border-hairline-strong bg-canvas shadow-2xl lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-hairline-strong p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-ink font-bold text-xs">
                    TF
                  </div>
                  <span className="font-extrabold text-ink">TalentFlow</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-2 text-mute hover:bg-surface-card hover:text-ink"
                  aria-label="Đóng menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* User profile card inside drawer */}
              {user && (
                <div className="border-b border-hairline p-4 bg-surface-card/40">
                  <div className="flex items-center gap-3">
                    <Avatar initials={user.email.split("@")[0]} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-sm font-bold text-ink">{user.email}</p>
                      <p className="text-caption text-mute capitalize">{isRecruiter ? "Nhà tuyển dụng" : "Ứng viên"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Drawer Links */}
              <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
                {/* Guest links */}
                {!user && (
                  <>
                    <Link
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Home size={18} className="text-mute" />
                      <span>Trang chủ</span>
                    </Link>
                    <Link
                      href="/jobs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/jobs" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Briefcase size={18} className="text-mute" />
                      <span>Việc làm</span>
                    </Link>
                    <Link
                      href="/external-jobs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/external-jobs" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Globe2 size={18} className="text-mute" />
                      <span>Việc làm tổng hợp (4 nguồn)</span>
                    </Link>
                    <Link
                      href="/search"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/search" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Search size={18} className="text-mute" />
                      <span>Tìm kiếm</span>
                    </Link>
                  </>
                )}

                {/* Candidate links */}
                {user && !isRecruiter && (
                  <>
                    <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-mute">
                      Chính
                    </div>
                    <Link
                      href="/feed"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/feed" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Rss size={18} className="text-mute" />
                      <span>Bảng tin</span>
                    </Link>
                    <Link
                      href="/network"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/network" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Users size={18} className="text-mute" />
                      <span>Mạng lưới</span>
                    </Link>
                    <Link
                      href="/messages"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/messages" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <MessageSquare size={18} className="text-mute" />
                      <span>Tin nhắn</span>
                    </Link>

                    <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-mute">
                      Việc làm
                    </div>
                    <Link
                      href="/jobs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/jobs" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Briefcase size={18} className="text-mute" />
                      <span>Việc làm tuyển dụng</span>
                    </Link>
                    <Link
                      href="/external-jobs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/external-jobs" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Globe2 size={18} className="text-mute" />
                      <span>Việc làm tổng hợp (4 nguồn)</span>
                    </Link>
                    <Link
                      href="/saved-jobs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/saved-jobs" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Bookmark size={18} className="text-mute" />
                      <span>Việc làm đã lưu</span>
                    </Link>
                    <Link
                      href="/applications"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/applications" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <FileCheck size={18} className="text-mute" />
                      <span>Đơn ứng tuyển</span>
                    </Link>

                    <div className="px-3 pt-4 pb-1 text-[11px] font-bold uppercase tracking-wider text-mute">
                      Công cụ nghề nghiệp
                    </div>
                    <Link
                      href="/cv-builder"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/cv-builder" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <FileText size={18} className="text-mute" />
                      <span>Tạo CV với AI</span>
                    </Link>
                    <Link
                      href="/goals"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/goals" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Target size={18} className="text-mute" />
                      <span>Mục tiêu nghề nghiệp</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/profile" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <User size={18} className="text-mute" />
                      <span>Hồ sơ của tôi</span>
                    </Link>
                  </>
                )}

                {/* Recruiter links */}
                {user && isRecruiter && (
                  <>
                    <div className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wider text-mute">
                      Quản trị tuyển dụng
                    </div>
                    <Link
                      href="/recruiter/dashboard"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/recruiter/dashboard" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <LayoutDashboard size={18} className="text-mute" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/recruiter/jobs/new"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/recruiter/jobs/new" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <PlusCircle size={18} className="text-mute" />
                      <span>Đăng tin tuyển dụng</span>
                    </Link>
                    <Link
                      href="/recruiter/analytics"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/recruiter/analytics" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <BarChart3 size={18} className="text-mute" />
                      <span>Analytics</span>
                    </Link>
                    <Link
                      href="/feed"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/feed" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Rss size={18} className="text-mute" />
                      <span>Bảng tin</span>
                    </Link>
                    <Link
                      href="/network"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/network" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <Users size={18} className="text-mute" />
                      <span>Mạng lưới</span>
                    </Link>
                    <Link
                      href="/messages"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/messages" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <MessageSquare size={18} className="text-mute" />
                      <span>Tin nhắn</span>
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold transition ${
                        pathname === "/profile" ? "bg-surface-elevated text-ink" : "text-body hover:bg-surface-card"
                      }`}
                    >
                      <User size={18} className="text-mute" />
                      <span>Hồ sơ công ty / nhà tuyển dụng</span>
                    </Link>
                  </>
                )}

                {/* Logout inside drawer */}
                {user && (
                  <div className="mt-auto pt-4 border-t border-hairline">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-body-sm font-semibold text-negative hover:bg-negative/10"
                    >
                      <LogOut size={18} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-hairline p-4 flex items-center justify-between bg-surface-card/60">
                <span className="text-xs text-mute font-medium">Chế độ giao diện</span>
                <ThemeToggle showLabel />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main id="main-content" className={`mx-auto w-full min-w-0 flex-1 ${isHomePage ? 'p-0' : 'px-4 pb-16 pt-24 sm:px-6 max-w-container'}`}>
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
                    Tìm việc làm
                  </Link>
                </li>
                <li>
                  <Link href="/external-jobs" className="hover:text-primary transition-colors">
                    Việc làm tổng hợp
                  </Link>
                </li>
                <li>
                  <Link href="/applications" className="hover:text-primary transition-colors">
                    Đơn ứng tuyển
                  </Link>
                </li>
                <li>
                  <Link href="/goals" className="hover:text-primary transition-colors">
                    Mục tiêu nghề nghiệp
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
              <p className="text-body-sm font-semibold text-ink">Nhà tuyển dụng</p>
              <ul className="mt-4 space-y-3 text-body-sm text-body">
                <li>
                  <Link href="/recruiter/dashboard" className="hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/recruiter/jobs/new" className="hover:text-primary transition-colors">
                    Đăng tin tuyển dụng
                  </Link>
                </li>
                <li>
                  <Link href="/recruiter/analytics" className="hover:text-primary transition-colors">
                    Thống kê tuyển dụng
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-body-sm font-semibold text-ink">Nền tảng</p>
              <p className="mt-4 text-body-sm text-body">
                Hệ thống tổng hợp dữ liệu việc làm từ ITviec, CareerViet, TopCV và VietnamWorks.
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
