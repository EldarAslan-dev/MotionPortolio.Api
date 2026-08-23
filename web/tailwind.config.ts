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
        // "Tally" system: a near-black screening-room canvas, warm paper
        // type, and exactly one accent — the red of an active-recording
        // tally light / NLE playhead.
        void: "#0A0A09", // dominant background
        surface: "#141311", // elevated panels / modals
        bone: "#F3EFE6", // primary text
        mist: "rgba(243,239,230,0.55)", // secondary text
        cue: "#FF3B2F", // the single accent
        "cue-soft": "#FF6F63", // accent hover tint
        line: "rgba(243,239,230,0.12)", // hairline borders
      },
      fontFamily: {
        display: ["Helvetica", "sans-serif"],
        sans: ["Helvetica", "sans-serif"],
        mono: ["Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
