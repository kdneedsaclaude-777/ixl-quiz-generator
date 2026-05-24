"use client";

import { useId, useState } from "react";

// Lightweight tooltip: shows on hover and on keyboard focus, with the content
// announced via aria-describedby for screen readers.
export default function Tooltip({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex">
      <span
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        tabIndex={0}
        className="inline-flex cursor-help"
      >
        {children}
      </span>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max max-w-xs -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-slate-100 dark:text-slate-900"
        >
          {label}
        </span>
      )}
    </span>
  );
}
