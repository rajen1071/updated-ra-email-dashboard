/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        panel: "rgb(var(--color-panel) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        sidebar: "rgb(var(--color-sidebar) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)",
        muted: "#8593A8",
        brand: "rgb(var(--color-brand) / <alpha-value>)",
        accent: {
          blue: "#3B82F6",
          green: "#22C55E",
          orange: "#F5A623",
          purple: "#A855F7",
          red: "#EF4444",
          teal: "#14B8A6",
          pink: "#EC4899",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.3)",
      },
    },
  },
  plugins: [],
};
