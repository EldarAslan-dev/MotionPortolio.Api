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
        void: "rgb(var(--void) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        bone: "rgb(var(--bone) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)",
        cue: "rgb(var(--cue) / <alpha-value>)",
        "cue-soft": "rgb(var(--cue-soft) / <alpha-value>)",
        line: "rgb(var(--line) / 0.14)",
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
