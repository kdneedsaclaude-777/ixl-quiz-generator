"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import CMIcon from "@/components/CMIcon";

type Item = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

// Bell with an unread badge and a click-to-open dropdown of recent
// notifications (like a typical web-app notification tray). Reads from
// GET /api/notifications and marks read via POST /api/notifications/read.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: Item[]; unread: number };
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      /* silent — the bell just won't update */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // light poll so the badge stays fresh
    return () => clearInterval(t);
  }, [load]);

  // Close when clicking outside the bell/popover.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function markAll() {
    setItems((xs) => xs.map((x) => ({ ...x, readAt: x.readAt ?? new Date().toISOString() })));
    setUnread(0);
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {});
  }

  async function markOne(id: string) {
    setItems((xs) => xs.map((x) => (x.id === id ? { ...x, readAt: x.readAt ?? new Date().toISOString() } : x)));
    setUnread((u) => Math.max(0, u - 1));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative grid h-9 w-9 place-items-center rounded-full text-slate-600 transition-colors hover:bg-slate-100"
      >
        <CMIcon name="bell" size={18} color="currentColor" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-cm-red px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="text-xs font-medium text-cm-blue hover:underline">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-400">You&apos;re all caught up 🎉</p>
            ) : (
              items.map((n) => {
                const isUnread = !n.readAt;
                const inner = (
                  <div className="flex gap-2.5">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: isUnread ? "var(--cm-blue)" : "transparent" }}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-slate-900">{n.title}</div>
                      <div className="mt-0.5 text-xs leading-snug text-slate-500">{n.body}</div>
                      <div className="mt-1 text-[10px] text-slate-400">{timeAgo(n.createdAt)}</div>
                    </div>
                  </div>
                );
                const cls = `block w-full px-4 py-3 text-left transition-colors hover:bg-slate-50 ${isUnread ? "bg-cm-blue-50/50" : ""}`;
                return n.href ? (
                  <Link key={n.id} href={n.href} onClick={() => { void markOne(n.id); setOpen(false); }} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <button key={n.id} type="button" onClick={() => void markOne(n.id)} className={cls}>
                    {inner}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
