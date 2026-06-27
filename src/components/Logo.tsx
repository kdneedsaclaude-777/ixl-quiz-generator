import React from "react";

// QuizSpark brand mark — open book + pixel-square cluster, ported
// verbatim from the design bundle (screens/auth.jsx). Pure SVG, no deps.
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      style={{ flex: "none" }}
      aria-hidden
    >
      {/* red top curve */}
      <path d="M8 22 Q 32 10 56 22 L 56 18 Q 32 6 8 18 Z" fill="#C25F5F" />
      {/* gold open pages */}
      <path d="M10 22 L 32 18 L 32 50 L 10 46 Z" fill="#E8A317" />
      <path d="M54 22 L 32 18 L 32 50 L 54 46 Z" fill="#E8A317" opacity="0.9" />
      {/* center spine */}
      <rect x="31" y="18" width="2" height="32" fill="#FFFFFF" opacity="0.5" />
      {/* blue bottom curve */}
      <path d="M8 46 Q 32 56 56 46 L 56 50 Q 32 60 8 50 Z" fill="#7090C0" />
      {/* pixel squares (top-right cluster) */}
      <rect x="44" y="6" width="6" height="6" rx="1" fill="#E8A317" />
      <rect x="52" y="10" width="5" height="5" rx="1" fill="#7090C0" />
      <rect x="46" y="14" width="4" height="4" rx="1" fill="#C25F5F" />
    </svg>
  );
}

// Full lockup: mark + wordmark (+ optional tagline). `dark` flips the
// wordmark to white for the admin shell.
export function Logo({
  size = 32,
  tagline = false,
  dark = false,
  className = "",
}: {
  size?: number;
  tagline?: boolean;
  dark?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <span className="inline-flex flex-col leading-none">
        <span
          className="font-extrabold tracking-tight"
          style={{ fontSize: size * 0.58, color: dark ? "#FFFFFF" : "#4D4D4D" }}
        >
          QuizSpark
        </span>
        {tagline && (
          <span
            className="mt-1 font-medium"
            style={{
              fontSize: size * 0.3,
              letterSpacing: ".18em",
              color: dark ? "rgba(255,255,255,.7)" : "#7090C0",
            }}
          >
            BY CONCEPT MASTERY
          </span>
        )}
      </span>
    </span>
  );
}

export default Logo;
