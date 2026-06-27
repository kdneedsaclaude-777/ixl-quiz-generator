"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CMIcon from "@/components/CMIcon";
import { CHILD_TABS, hidesChildTabBar } from "@/lib/child-nav";

// Bottom tab bar for the student app — the glassy floating pill from the
// design bundle (student.jsx). Fixed to the bottom of the viewport, four tabs
// (Home/Progress/Badges/Me) from the shared CHILD_TABS source of truth, active
// tab filled with brand blue. Hidden on focused task flows (quiz/test/select).
export default function StudentTabBar() {
  const pathname = usePathname() ?? "";
  if (hidesChildTabBar(pathname)) return null;

  return (
    <nav
      className="fixed inset-x-4 bottom-5 z-40 mx-auto grid max-w-md grid-cols-4 gap-1 rounded-full border border-slate-200 p-1.5 shadow-card backdrop-blur-xl"
      style={{ background: "rgba(255,255,255,.85)" }}
      aria-label="Student navigation"
    >
      {CHILD_TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 rounded-full py-2 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cm-blue ${
              active ? "bg-cm-blue text-white" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <CMIcon name={t.icon} size={18} color={active ? "#fff" : "#64748B"} />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
