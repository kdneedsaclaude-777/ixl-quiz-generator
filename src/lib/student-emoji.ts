// Deterministic per-student emoji avatar, matching the design bundle's
// playful kid avatars (🦊 🐼 …). Stable for a given student id so the same
// kid always shows the same animal — no schema change needed.
const EMOJI = ["🦊", "🐼", "🐯", "🦄", "🐸", "🐙", "🦁", "🐧", "🦉", "🐨", "🐵", "🐶"];

// Palette a kid can choose from on their account page.
export const AVATAR_CHOICES = ["🦊", "🐼", "🐯", "🦄", "🐸", "🐙", "🦁", "🐧", "🦉", "🐨", "🐵", "🐶", "🐱", "🐰", "🐲", "🦋", "🐝", "🐢"];

export function studentEmoji(seed: number | string): string {
  const n = typeof seed === "number" ? seed : [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
  return EMOJI[Math.abs(n) % EMOJI.length];
}

// Preferred avatar: the student's chosen one, else the deterministic fallback.
export function avatarFor(s: { id: number; avatar?: string | null }): string {
  return s.avatar || studentEmoji(s.id);
}
