import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { AppShellClient } from "../components/app-shell-client";
import { Providers } from "../components/providers";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "TalentFlow — AI Recruitment Platform",
  description: "AI-powered recruitment with professional networking"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <Providers>
          <AppShellClient>{children}</AppShellClient>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "var(--colors-canvas)",
                color: "var(--colors-ink)",
                border: "1px solid var(--colors-ink)",
                borderRadius: "var(--rounded-xl)"
              }
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
