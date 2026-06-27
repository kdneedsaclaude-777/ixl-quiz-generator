import type { Config } from "tailwindcss";

// Concept Mastery design system (from the Claude Design handoff bundle).
// The design's tokens.css retunes the whole app onto the brand palette:
// steel-blue primary, warm red, gold, mint, warm paper. We remap Tailwind's
// `indigo` scale to the brand steel-blue ramp so the ~1,100 existing
// `indigo-*` utilities across the app shift to brand color with no edits;
// `amber`→gold keeps the kid/warning accents on-brand too.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Brand steel-blue ramp (primary accent everywhere).
        indigo: {
          50: "#EDF2F9",
          100: "#DBE4F2",
          200: "#C2D2E9",
          300: "#9FB6D6",
          400: "#7090C0",
          500: "#5C7BAE",
          600: "#4A6896",
          700: "#3D567B",
          800: "#334862",
          900: "#2C3C52",
          950: "#1B2533",
        },
        // Brand gold ramp (amber utilities retune to logo gold).
        amber: {
          50: "#FBEACB",
          100: "#FBEACB",
          200: "#F6D89A",
          300: "#F0C56A",
          400: "#EDB23F",
          500: "#E8A317",
          600: "#C98910",
          700: "#92400E",
          800: "#7A360C",
          900: "#612C0A",
          950: "#3D1B06",
        },
        // Brand palette under explicit `cm-*` names for new design work.
        cm: {
          blue: "#5C7BAE",
          "blue-600": "#4A6896",
          "blue-500": "#7090C0",
          "blue-100": "#DBE4F2",
          "blue-50": "#EDF2F9",
          red: "#C25F5F",
          "red-soft": "#F4DCDC",
          gold: "#E8A317",
          "gold-soft": "#FBEACB",
          mint: "#4E9F7B",
          "mint-soft": "#DCEFE3",
          rose: "#B14444",
          paper: "#FAFAF7",
          ink: "#0F172A",
          // dark admin shell
          shell: "#0B1220",
          "shell-card": "#111A2E",
          "shell-border": "#1F2A44",
        },
      },
      fontFamily: {
        sans: ["var(--font-ui)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Instrument Serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "2xl": "24px",
        "3xl": "32px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,.04), 0 8px 24px -8px rgba(15,23,42,.08)",
        pop: "0 4px 12px rgba(15,23,42,.08), 0 24px 48px -12px rgba(15,23,42,.18)",
        kid: "0 6px 0 rgba(15,23,42,.08)",
      },
    },
  },
  plugins: [],
};

export default config;
