"use client";

import { useEffect } from "react";
import { LogoMark } from "@/components/Logo";

// Catches errors thrown inside the root layout itself. Must render its own
// <html> + <body> since the layout has failed to mount. App CSS (Tailwind,
// cm-* tokens) is NOT guaranteed here, so everything stays inline-styled.
// LogoMark is pure SVG with no CSS dependency, so it's safe to render.
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
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1rem",
          background: "#FAFAF7",
          color: "#0F172A",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#fff",
            border: "1px solid #E2E8F0",
            borderRadius: 18,
            boxShadow: "0 1px 2px rgba(15,23,42,.04), 0 8px 24px -8px rgba(15,23,42,.08)",
            padding: "2.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <LogoMark size={40} />
          </div>
          <span
            style={{
              display: "inline-block",
              fontSize: 12,
              fontWeight: 600,
              color: "#B43326",
              background: "#F4DCDC",
              borderRadius: 999,
              padding: "4px 12px",
            }}
          >
            Critical error
          </span>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            We couldn&apos;t load the app
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: "#64748B" }}>
            The page failed to load. Please refresh, or come back in a few minutes.
          </p>
          {error.digest && (
            <p
              style={{
                marginTop: 12,
                fontSize: 11,
                fontFamily: "monospace",
                color: "#94A3B8",
              }}
            >
              Error ref: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              height: 44,
              padding: "0 24px",
              background: "#5C7BAE",
              color: "white",
              border: 0,
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
