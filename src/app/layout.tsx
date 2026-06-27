import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import DarkModeToggle from "@/components/DarkModeToggle";
import ThemeBootstrap from "@/components/ThemeBootstrap";
import AuthProvider from "@/components/AuthProvider";
import { Logo } from "@/components/Logo";
import { getServerThemeClass } from "@/lib/theme";

// QuizSpark design typography. Exposed as CSS vars the tokens + Tailwind
// font families consume (--font-ui / --font-display / --font-mono).
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-ui",
  display: "swap",
});
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
});

const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  applicationName: "QuizSpark",
  title: { default: "QuizSpark", template: "%s · QuizSpark" },
  description: "Adaptive math quizzes for Grades 1–8, by Concept Mastery.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon.svg" }],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "QuizSpark" },
};

// Themed status-bar / browser-chrome color, light + dark.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#5C7BAE" },
    { media: "(prefers-color-scheme: dark)", color: "#1E293B" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // For logged-in users we know the dark-mode preference from the DB and can
  // ship the right <html> class with the SSR response — no flash, no client
  // round-trip. Anonymous users still fall through to ThemeBootstrap, which
  // reads localStorage + prefers-color-scheme.
  const themeClass = await getServerThemeClass();

  const fontVars = `${jakarta.variable} ${instrument.variable} ${jetbrains.variable}`;

  // Full-bleed routes own their entire viewport (their own shells / sidebars /
  // bottom tab bars), so the root drops its global chrome + max-width column.
  // Every role app + the quiz runner + live classroom is full-bleed; only the
  // landing page and /auth/* still use the root's centered column.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const fullBleed =
    pathname.startsWith("/child") ||
    pathname.startsWith("/quiz") ||
    pathname.startsWith("/live") ||
    pathname.startsWith("/parent") ||
    pathname.startsWith("/tutor") ||
    pathname.startsWith("/admin");

  return (
    <html lang="en" className={`${fontVars} ${themeClass ?? ""}`.trim()} suppressHydrationWarning>
      <head>
        <ThemeBootstrap />
      </head>
      <body className="min-h-screen antialiased">
        <AuthProvider>
          {fullBleed ? (
            children
          ) : (
            <div className="flex min-h-screen flex-col">
              <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 pt-6">
                <Link href="/" aria-label="QuizSpark home" className="hover:opacity-80">
                  <Logo size={26} />
                </Link>
                <DarkModeToggle />
              </div>
              <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</div>
              <footer className="mx-auto w-full max-w-3xl px-4 pb-8 pt-4">
                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-slate-400 dark:text-slate-500">
                  <span>© {new Date().getFullYear()} Concept Mastery</span>
                  <Link href="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300">Privacy</Link>
                  <Link href="/terms" className="hover:text-slate-600 dark:hover:text-slate-300">Terms</Link>
                  <Link href="/delete-account" className="hover:text-slate-600 dark:hover:text-slate-300">Delete account</Link>
                  <a href="mailto:admin@conceptmastery.ca" className="hover:text-slate-600 dark:hover:text-slate-300">Contact</a>
                </div>
              </footer>
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  );
}
