"use client";

import Link from "next/link";
import { useState } from "react";
import CMIcon from "@/components/CMIcon";

type Note = { id: string; title: string; body: string; href: string | null };

// In-app notification banners (billing events). Shown at the top of the parent
// dashboard; dismissing marks the notification read.
export default function NotificationBanners({ initial }: { initial: Note[] }) {
  const [notes, setNotes] = useState(initial);

  async function dismiss(id: string) {
    setNotes((n) => n.filter((x) => x.id !== id));
    try {
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      /* best-effort */
    }
  }

  if (notes.length === 0) return null;

  return (
    <div className="space-y-2">
      {notes.map((n) => (
        <div
          key={n.id}
          className="flex items-start gap-3 rounded-[18px] p-3.5"
          style={{ background: "var(--cm-mint-soft)", border: "1px solid rgba(78,159,123,.4)" }}
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white" aria-hidden>
            <CMIcon name="spark" size={18} color="var(--cm-mint)" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-extrabold text-slate-900">{n.title}</div>
            <div className="text-xs text-slate-600">{n.body}</div>
            {n.href && (
              <Link href={n.href} className="mt-1 inline-block text-xs font-semibold" style={{ color: "var(--cm-blue)" }}>
                View details →
              </Link>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(n.id)}
            aria-label="Dismiss"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-white/60"
          >
            <CMIcon name="x" size={14} color="var(--slate-500)" />
          </button>
        </div>
      ))}
    </div>
  );
}
