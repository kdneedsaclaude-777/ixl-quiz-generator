// Deterministic colored initial avatar. Same name always gets the same color.
const PALETTE = [
  { bg: "bg-rose-500", ring: "ring-rose-300" },
  { bg: "bg-orange-500", ring: "ring-orange-300" },
  { bg: "bg-amber-500", ring: "ring-amber-300" },
  { bg: "bg-emerald-500", ring: "ring-emerald-300" },
  { bg: "bg-teal-500", ring: "ring-teal-300" },
  { bg: "bg-sky-500", ring: "ring-sky-300" },
  { bg: "bg-indigo-500", ring: "ring-indigo-300" },
  { bg: "bg-violet-500", ring: "ring-violet-300" },
  { bg: "bg-fuchsia-500", ring: "ring-fuchsia-300" },
  { bg: "bg-pink-500", ring: "ring-pink-300" },
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const palette = PALETTE[hashName(name) % PALETTE.length];
  return (
    <div
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full ${palette.bg} font-semibold text-white shadow-sm`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials(name)}
    </div>
  );
}
