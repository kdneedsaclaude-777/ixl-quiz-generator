"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo, LogoMark } from "@/components/Logo";
import CMIcon from "@/components/CMIcon";

export type ShellNavItem = { href: string; icon: string; label: string };

// Left-sidebar app shell, ported from the design bundle (parent.jsx /
// admin.jsx). `tone="light"` = white sidebar + steel-blue active pills
// (parent, tutor). `tone="dark"` = dark slate shell + indigo-tint active
// (admin / org-admin). Active state is by URL prefix.
export default function SidebarShell({
  tone = "light",
  accent = "blue",
  items,
  eyebrow,
  orgChip,
  trailing,
  topActions,
  children,
}: {
  tone?: "light" | "dark";
  accent?: "blue" | "mint";
  items: ShellNavItem[];
  eyebrow?: string;
  orgChip?: { initials: string; name: string };
  trailing?: React.ReactNode;
  topActions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const dark = tone === "dark";
  // Light-tone active accent: tutor uses mint, everyone else steel-blue.
  const lightActiveBg = accent === "mint" ? "var(--cm-mint-soft)" : "var(--cm-blue-50)";
  const lightActiveColor = accent === "mint" ? "#047857" : "var(--cm-blue)";

  return (
    <div
      className="cm min-h-screen md:grid"
      style={{
        gridTemplateColumns: "240px 1fr",
        background: dark ? "var(--shell-bg)" : "var(--paper)",
        color: dark ? "var(--shell-text)" : "var(--ink)",
      }}
    >
      {/* Sidebar */}
      <aside
        className="hidden flex-col md:flex"
        style={{
          background: dark ? "var(--shell-card)" : "#fff",
          borderRight: `1px solid ${dark ? "var(--shell-border)" : "var(--slate-200)"}`,
          padding: 18,
        }}
      >
        {dark ? (
          <div className="flex items-center gap-2">
            <LogoMark size={28} />
            <span className="text-[15px] font-extrabold tracking-tight text-white">QuizSpark</span>
          </div>
        ) : (
          <Logo size={24} />
        )}

        {eyebrow && (
          <div
            className="mt-1.5 text-[11px] font-semibold tracking-[.08em]"
            style={{ color: dark ? "var(--shell-muted)" : "var(--slate-400)" }}
          >
            {eyebrow}
          </div>
        )}

        {orgChip && (
          <div
            className="mt-3.5 flex items-center gap-2.5 rounded-[10px] p-2.5"
            style={{ background: "rgba(232,163,23,.10)", border: "1px solid rgba(232,163,23,.3)" }}
          >
            <div
              className="grid h-7 w-7 place-items-center rounded-lg text-[12px] font-extrabold text-white"
              style={{ background: "linear-gradient(135deg, #C25F5F, #E8A317)" }}
            >
              {orgChip.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold tracking-[.06em]" style={{ color: "var(--shell-muted)" }}>
                {eyebrow ?? "ORG"}
              </div>
              <div className="truncate text-[13px] font-bold text-white">{orgChip.name}</div>
            </div>
          </div>
        )}

        <nav className="mt-5 grid gap-1">
          {items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
            const activeBg = dark ? "rgba(99,102,241,.18)" : lightActiveBg;
            const activeColor = dark ? "#A5B4FC" : lightActiveColor;
            return (
              <Link
                key={it.href}
                href={it.href}
                className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-sm"
                style={{
                  background: active ? activeBg : "transparent",
                  color: active ? activeColor : dark ? "var(--shell-text)" : "var(--slate-700)",
                  fontWeight: active ? 700 : 500,
                }}
              >
                <CMIcon name={it.icon} size={18} color="currentColor" />
                {it.label}
              </Link>
            );
          })}
        </nav>

      </aside>

      <div className="flex flex-col">
        {/* Desktop top bar — right-aligned actions + log out */}
        <div
          className="hidden items-center justify-end gap-2 px-7 py-2.5 md:flex"
          style={{
            background: dark ? "var(--shell-card)" : "#fff",
            borderBottom: `1px solid ${dark ? "var(--shell-border)" : "var(--slate-200)"}`,
          }}
        >
          {topActions}
          {trailing}
        </div>

        {/* Mobile top bar (sidebar hidden < md) */}
        <div
          className="flex items-center justify-between px-4 py-3 md:hidden"
          style={{
            background: dark ? "var(--shell-card)" : "#fff",
            borderBottom: `1px solid ${dark ? "var(--shell-border)" : "var(--slate-200)"}`,
          }}
        >
          {dark ? <span className="font-extrabold text-white">QuizSpark</span> : <Logo size={22} />}
          <div className="flex items-center gap-2">
            {topActions}
            {trailing}
          </div>
        </div>

        {/* Mobile tab strip */}
        <div
          className="flex gap-1 overflow-x-auto px-3 py-2 md:hidden"
          style={{
            background: dark ? "var(--shell-card)" : "#fff",
            borderBottom: `1px solid ${dark ? "var(--shell-border)" : "var(--slate-200)"}`,
          }}
        >
          {items.map((it) => {
            const active = pathname === it.href || pathname.startsWith(`${it.href}/`);
            return (
              <Link
                key={it.href}
                href={it.href}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: active ? (dark ? "rgba(99,102,241,.18)" : lightActiveBg) : "transparent",
                  color: active ? (dark ? "#A5B4FC" : lightActiveColor) : dark ? "var(--shell-muted)" : "var(--slate-500)",
                }}
              >
                {it.label}
              </Link>
            );
          })}
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-7">{children}</main>
      </div>
    </div>
  );
}
