import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { AppShellClient } from "../components/app-shell-client";
import { Providers } from "../components/providers";

export const metadata: Metadata = {
  title: "TalentFlow — AI Recruitment Platform",
  description: "AI-powered recruitment with professional networking"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <Providers>
          <AppShellClient>{children}</AppShellClient>
        </Providers>
      </body>
    </html>
  );
}
