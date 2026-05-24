// Renders a question's visual. `svg` MUST already be sanitized by the caller
// (server-side, via sanitizeSvg) — this component only presents it. When no
// safe SVG is available it falls back to the text visual_note so the question
// still makes sense.

export default function QuestionVisual({
  svg,
  note,
  className = "",
}: {
  svg: string | null;
  note: string | null;
  className?: string;
}) {
  if (svg) {
    return (
      <figure
        className={`mt-3 flex justify-center rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900 ${className}`}
      >
        <div
          // Pre-sanitized server-side with an allowlist (src/lib/sanitize-svg).
          className="max-h-64 w-full max-w-md [&_svg]:h-auto [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
          role="img"
          aria-label={note ?? "Question diagram"}
        />
      </figure>
    );
  }
  if (note) {
    return (
      <p
        className={`mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm italic text-slate-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 ${className}`}
      >
        🖼️ {note}
      </p>
    );
  }
  return null;
}
