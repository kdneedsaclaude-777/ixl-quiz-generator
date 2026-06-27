"use client";

import { useState } from "react";

// Role-tabbed segmented control from the design (auth.jsx AuthSignIn). Login
// itself is one shared credentials form — NextAuth reads the account's role
// and routes accordingly — so the tabs are an honest hint, not four different
// forms: each tab just explains how that role signs in.
const ROLES: { id: string; label: string; hint: string }[] = [
  { id: "parent", label: "Parent", hint: "Sign in to your family's learning space." },
  { id: "student", label: "Student", hint: "Use the email & password your parent set up — or tap “Are you a student?” below." },
  { id: "tutor", label: "Tutor", hint: "Sign in to your cohort dashboard." },
  { id: "admin", label: "Admin", hint: "Sign in to the platform console." },
];

export default function RoleTabs() {
  const [active, setActive] = useState("parent");
  const hint = ROLES.find((r) => r.id === active)?.hint;
  return (
    <div className="mb-5">
      <div className="grid grid-cols-4 gap-1.5 rounded-full border border-slate-200 bg-white p-1">
        {ROLES.map((r) => {
          const on = r.id === active;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActive(r.id)}
              className="grid h-9 place-items-center rounded-full text-[13px] font-semibold transition-colors"
              style={{ background: on ? "var(--cm-blue)" : "transparent", color: on ? "#fff" : "var(--slate-700)" }}
            >
              {r.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
