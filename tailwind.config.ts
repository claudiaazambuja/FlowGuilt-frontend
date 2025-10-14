import type { Config } from "tailwindcss";
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fg: {
          bg: "#0E0E0E", surface: "#151515", surface2: "#232323",
          primary: "#1DB954", accent: "#6C3BF4", text: "#F2F2F2"
        }
      }
    }
  },
  plugins: [],
} satisfies Config
