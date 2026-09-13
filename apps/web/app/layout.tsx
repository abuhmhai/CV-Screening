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
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var prefs = localStorage.getItem('cv_appearance_prefs');
                  var theme = 'dark';
                  if (prefs) {
                    var parsed = JSON.parse(prefs);
                    if (parsed.theme) theme = parsed.theme;
                  }
                  if (theme === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
                  }
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `
          }}
        />
      </head>
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
