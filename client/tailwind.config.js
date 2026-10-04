/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#08080C",
          surface: "#0E0E14",
          card: "#14141B",
          cardHover: "#1C1C26",
          input: "#1A1A24",
          border: "#262633",
          borderLight: "#353545",
          primary: "#FCFC65", // Ticketor signature neon lime yellow
          primaryHover: "#EAEA48",
          primaryDark: "#0B0B0E",
          cyan: "#74CFCF",
          cyanLight: "#B3E5E5",
          coral: "#FF5E5E",
          muted: "#8E8E9E",
          subtle: "#5A5A6E",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        neon: "0 0 25px -4px rgba(252, 252, 101, 0.4)",
        glow: "0 0 15px rgba(252, 252, 101, 0.25)",
        screenGlow: "0 10px 40px -10px rgba(252, 252, 101, 0.3)",
      },
    },
  },
  plugins: [],
}
