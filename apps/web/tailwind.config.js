/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        breath: {
          bg: "var(--breath-bg)",
          text: "var(--breath-text)",
          primary: "#3b82f6",
          secondary: "#60a5fa",
          accent: "#34d399",
          surface: "var(--breath-surface)",
          "surface-hover": "var(--breath-surface-hover)",
          border: "var(--breath-border)",
          "border-dashed": "var(--breath-border-dashed)",
          "input-bg": "var(--breath-input-bg)",
          "input-border": "var(--breath-input-border)",
          "ring-stroke": "var(--breath-ring-stroke)",
          muted: "var(--breath-text-muted)",
          "text-secondary": "var(--breath-text-secondary)",
        },
      },
    },
  },
  plugins: [],
};
