import type { Config } from "tailwindcss";

// Colors map to CSS variables defined in src/app/globals.css, which are derived from the
// seed kit's AERO shell tokens (seed-kit/lesson-factory/identity/tokens.css header comment) and
// the Electric Ink lesson family (identity/families.md).
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        shell: "var(--shell)",
        rail: "var(--rail)",
        panel: "var(--panel)",
        "panel-2": "var(--panel-2)",
        line: "var(--line)",
        "line-2": "var(--line-2)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        ok: "var(--ok)",
        gold: "var(--gold)",
        warn: "var(--warn)",
        bad: "var(--bad)",
        R: "var(--R)",
        I: "var(--I)",
        V: "var(--V)",
      },
      fontFamily: {
        display: ["Saira", "Space Grotesk", "system-ui", "sans-serif"],
        sans: ["IBM Plex Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "IBM Plex Mono", "monospace"],
      },
      borderRadius: { sm: "2px", DEFAULT: "3px", md: "4px", lg: "6px" },
    },
  },
  plugins: [],
};
export default config;
