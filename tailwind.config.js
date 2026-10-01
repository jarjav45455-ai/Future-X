/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./index.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        futurex: {
          bg: "#05030a",
          card: "#120d1f",
          border: "rgba(255, 255, 255, 0.08)",
          blue: "#38bdf8",
          purple: "#c084fc",
          accent: "#8b5cf6",
          darkPurple: "#581c87",
        },
      },
    },
  },
  plugins: [],
};