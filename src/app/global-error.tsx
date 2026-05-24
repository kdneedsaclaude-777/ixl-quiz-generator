"use client";

import { useEffect } from "react";

// Catches errors thrown inside the root layout itself. Must render its own
// <html> + <body> since the layout has failed to mount.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error.tsx]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "4rem 1rem", background: "#f8fafc", color: "#0f172a", textAlign: "center" }}>
        <div style={{ fontSize: 56 }} aria-hidden>⚠️</div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 12 }}>Critical error</h1>
        <p style={{ marginTop: 8, color: "#64748b" }}>
          The page failed to load. Please refresh or come back later.
        </p>
        {error.digest && (
          <p style={{ marginTop: 8, fontSize: 12, fontFamily: "monospace", color: "#94a3b8" }}>
            Error ref: {error.digest}
          </p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: 24, padding: "8px 16px", background: "#4f46e5", color: "white", border: 0, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
