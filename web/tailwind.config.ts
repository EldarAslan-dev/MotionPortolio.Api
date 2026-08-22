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
        paper: "#f4efe6",
        ink: "#14110e",
        muted: "#6d6458",
        amber: "#c45c26",
        "amber-soft": "#e8b089",
        panel: "#1c1814",
      },
    },
  },
  plugins: [],
} satisfies Config;
