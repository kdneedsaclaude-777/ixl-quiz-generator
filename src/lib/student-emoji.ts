// Deterministic per-student emoji avatar, matching the design bundle's
// playful kid avatars (🦊 🐼 …). Stable for a given student id so the same
// kid always shows the same animal — no schema change needed.
const EMOJI = ["🦊", "🐼", "🐯", "🦄", "🐸", "🐙", "🦁", "🐧", "🦉", "🐨", "🐵", "🐶"];

export function studentEmoji(seed: number | string): string {
  const n = typeof seed === "number" ? seed : [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  return EMOJI[Math.abs(n) % EMOJI.length];
}
