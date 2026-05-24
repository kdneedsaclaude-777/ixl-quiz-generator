"use client";

import { useState } from "react";

// Red sticky banner shown at the top of every /parent/* page while an admin
// is impersonating a parent. Clicking "Exit" clears the cookie and bounces
// back to the admin dashboard.
export default function ImpersonationBanner({ targetName }: { targetName: string }) {
  const [exiting, setExiting] = useState(false);

  async function exit() {
    setExiting(true);
    try {
      await fetch("/api/admin/impersonate/exit", { method: "POST" });
    } finally {
      window.location.href = "/admin/users";
    }
  }

  return (
    <div className="-mx-4 mb-4 flex items-center justify-between gap-3 border-b-2 border-rose-700 bg-rose-600 px-4 py-2 text-sm text-white">
      <span>
        ⚠ Impersonating <span className="font-semibold">{targetName}</span>. Actions taken here happen as that parent.
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={exiting}
        className="rounded bg-rose-800 px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-rose-900 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {exiting ? "Exiting…" : "Exit"}
      </button>
    </div>
  );
}
