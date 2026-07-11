import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#1c1917",
        oat: "#fafaf9",
      },
      fontFamily: {
        sans: ["Inter", "Geist", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 60px rgba(28, 25, 23, 0.08)",
        lift: "0 24px 80px rgba(28, 25, 23, 0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
