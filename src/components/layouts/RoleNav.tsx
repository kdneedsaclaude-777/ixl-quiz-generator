"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string };

// Compact top-nav used by parent and admin shells. Highlights the active
// section by URL prefix, falls back to a tight underline for keyboard focus.
export default function RoleNav({
  items,
  trailing,
  tone = "light",
}: {
  items: NavItem[];
  trailing?: React.ReactNode;
  tone?: "light" | "dark" | "warm";
}) {
  const pathname = usePathname() ?? "";
  const palette = tone === "dark"
    ? {
        bar: "border-slate-800 bg-slate-900 text-slate-100",
        active: "bg-slate-800 text-white",
        inactive: "text-slate-300 hover:bg-slate-800 hover:text-white",
      }
    : tone === "warm"
      ? {
          bar: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100",
          active: "bg-amber-200 text-amber-900 dark:bg-amber-700 dark:text-white",
          inactive: "text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:hover:bg-amber-900/40",
        }
      : {
          bar: "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
          active: "bg-indigo-600 text-white",
          inactive: "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
        };

  return (
    <nav className={`mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-2 py-2 text-sm ${palette.bar}`}>
      <ul className="flex flex-wrap items-center gap-1">
        {items.map((it) => {
          const isActive = pathname === it.href || pathname.startsWith(`${it.href}/`);
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${isActive ? palette.active : palette.inactive}`}
              >
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {trailing && <div className="flex items-center gap-2">{trailing}</div>}
    </nav>
  );
}
