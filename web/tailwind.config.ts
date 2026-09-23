import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Legacy aliases — kept so every existing component class
        // (bg-void, text-bone, border-line, text-cue, ...) keeps working
        // unchanged; they now resolve through the renamed --bg/--ink/
        // --muted/--accent/--border tokens (see globals.css).
        void: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        bone: "rgb(var(--ink) / <alpha-value>)",
        mist: "rgb(var(--muted) / <alpha-value>)",
        cue: "rgb(var(--accent) / <alpha-value>)",
        "cue-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        line: "rgb(var(--border) / 0.14)",
        // New semantic names for new components.
        bg: "rgb(var(--bg) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-soft": "rgb(var(--accent-soft) / <alpha-value>)",
        border: "rgb(var(--border) / 0.14)",
      },
      fontFamily: {
        display: [
          "SF Pro Display",
          "SF Pro Text",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        sans: [
          "SF Pro Text",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          "SF Pro Text",
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
