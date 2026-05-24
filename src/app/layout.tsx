import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import DarkModeToggle from "@/components/DarkModeToggle";
import ThemeBootstrap from "@/components/ThemeBootstrap";
import AuthProvider from "@/components/AuthProvider";
import { getServerThemeClass } from "@/lib/theme";

export const metadata: Metadata = {
  title: "IXL Quiz App",
  description: "Adaptive math quizzes for Grades 4–8",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // For logged-in users we know the dark-mode preference from the DB and can
  // ship the right <html> class with the SSR response — no flash, no client
  // round-trip. Anonymous users still fall through to ThemeBootstrap, which
  // reads localStorage + prefers-color-scheme.
  const themeClass = await getServerThemeClass();

  return (
    <html lang="en" className={themeClass ?? undefined} suppressHydrationWarning>
      <head>
        <ThemeBootstrap />
      </head>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 pt-6">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 dark:text-slate-200 dark:hover:text-indigo-400"
            >
              IXL Quiz App
            </Link>
            <DarkModeToggle />
          </div>
          <div className="mx-auto max-w-3xl px-4 py-8">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
