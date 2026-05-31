import Link from "next/link";
import { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/applications", label: "Applications" },
  { href: "/feed", label: "Feed" },
  { href: "/ai-score-detail", label: "AI Score" },
  { href: "/messages", label: "Messages" },
  { href: "/recruiter/dashboard", label: "Recruiter" },
  { href: "/profile", label: "Profile" },
  { href: "/auth/sign-in", label: "Sign In" }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas-soft text-ink">
      <header className="sticky top-0 z-20 border-b border-ink/10 bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="text-body-md font-semibold">AI Recruitment Platform</div>
          <nav className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-pill px-3 py-2 text-sm font-semibold text-ink transition hover:bg-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
