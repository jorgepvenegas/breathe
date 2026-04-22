/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,ts}"],
  theme: {
    extend: {
      colors: {
        breath: {
          bg: "#0f172a",
          primary: "#3b82f6",
          secondary: "#60a5fa",
          accent: "#34d399",
          surface: "rgba(255,255,255,0.04)",
          border: "rgba(255,255,255,0.06)",
        },
      },
    },
  },
  plugins: [],
};
