// Tiny SVG line chart, ported from the design bundle (parent.jsx). Used on
// parent + admin screens for score trends.
//
// LOCAL ENHANCEMENTS (keep on any re-sync from the mockup): a set of OPTIONAL,
// opt-in props clarify the axis without changing existing callers. Every new
// prop defaults to the original behaviour, so the parent child-detail and tutor
// sparks render exactly as before until they opt in. The parent "Score · Last 7
// days" card opts into domain/gridlines/unitSuffix so the % scale is explicit
// (auto-scaling otherwise makes a 0→100 jump and a 60→70 jump look identical).
export default function Spark({
  points,
  w = 280,
  h = 80,
  color = "var(--cm-blue)",
  fill = "var(--cm-blue-50)",
  domain,
  gridlines,
  unitSuffix = "",
  baseline = false,
  showLastValue = false,
  gridlineColor = "var(--slate-200)",
  labelColor = "var(--slate-500)", // slate-500 clears WCAG AA on white
  padRight = 0,
  ariaLabel,
}: {
  points: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: string;
  domain?: [number, number];
  gridlines?: number[];
  unitSuffix?: string;
  baseline?: boolean;
  showLastValue?: boolean;
  gridlineColor?: string;
  labelColor?: string;
  padRight?: number;
  ariaLabel?: string;
}) {
  if (points.length === 0) {
    return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={ariaLabel ?? "No data"} />;
  }
  const [domMin, domMax] = domain ?? [Math.min(...points), Math.max(...points)];
  const range = domMax - domMin || 1;
  // Default x-mapping is byte-identical to the original when padRight === 0.
  const sx = (i: number) => (i / (points.length - 1 || 1)) * (w - 8 - padRight) + 4;
  const sy = (v: number) => h - 6 - ((v - domMin) / range) * (h - 16);
  const path = points.map((v, i) => `${i ? "L" : "M"} ${sx(i).toFixed(1)} ${sy(v).toFixed(1)}`).join(" ");
  const area = `${path} L ${sx(points.length - 1)} ${h} L ${sx(0)} ${h} Z`;
  const lastX = sx(points.length - 1);
  const lastY = sy(points[points.length - 1]);
  const lastInRightZone = points.length > 1 && lastX > w * 0.8;
  const gridMax = gridlines && gridlines.length ? Math.max(...gridlines) : null;
  const autoLabel =
    ariaLabel ??
    `Score trend, ${Math.round(points[0])}${unitSuffix} to ${Math.round(points[points.length - 1])}${unitSuffix}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={autoLabel}>
      {/* Gridlines + right-edge labels (behind the data) */}
      {gridlines?.map((v) => (
        <g key={v} aria-hidden>
          <line
            x1={4}
            x2={w - 4 - padRight}
            y1={sy(v)}
            y2={sy(v)}
            stroke={gridlineColor}
            strokeWidth={1}
            strokeDasharray="2 3"
          />
          <text x={w - 2} y={sy(v) + 3} textAnchor="end" fontSize={9} fill={labelColor}>
            {`${v}${v === gridMax ? unitSuffix : ""}`}
          </text>
        </g>
      ))}
      {baseline && (
        <line x1={4} x2={w - 4 - padRight} y1={h - 6} y2={h - 6} stroke="var(--slate-200)" strokeWidth={1} aria-hidden />
      )}
      <path d={area} fill={fill} opacity={0.6} />
      <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((v, i) => (
        <circle key={i} cx={sx(i)} cy={sy(v)} r={i === points.length - 1 ? 4 : 0} fill={color} />
      ))}
      {showLastValue && (
        <text
          x={lastInRightZone ? lastX - 6 : lastX + 6}
          y={Math.max(11, lastY - 6)}
          textAnchor={lastInRightZone ? "end" : "start"}
          fontSize={11}
          fontWeight={700}
          fill={color}
        >
          {`${Math.round(points[points.length - 1])}${unitSuffix}`}
        </text>
      )}
    </svg>
  );
}
