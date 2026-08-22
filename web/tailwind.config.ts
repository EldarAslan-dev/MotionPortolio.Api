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
        // Cinematic "Graphite + Warm Ivory + Electric Cobalt" system.
        // Names kept stable so every existing bg-ink/text-paper/etc. class
        // keeps compiling — only the rendered hues change.
        paper: "#F5F2EA", // warm ivory — text-on-dark + light surface accents
        ink: "#0B0C0F", // deep graphite — dominant background
        muted: "rgba(245,242,234,0.55)", // ivory-based muted text on dark
        amber: "#5B61E6", // electric cobalt — the single restrained accent
        "amber-soft": "#8B90F2", // lighter cobalt tint
        panel: "#141519", // elevated graphite surface (cards/footer/modals)
      },
    },
  },
  plugins: [],
} satisfies Config;
