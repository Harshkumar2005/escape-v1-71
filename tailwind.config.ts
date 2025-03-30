
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        sidebar: "hsl(var(--sidebar))",
        "sidebar-foreground": "hsl(var(--sidebar-foreground))",
        editor: "hsl(var(--editor))",
        "editor-line": "hsl(var(--editor-line))",
        terminal: "hsl(var(--terminal))",
        "terminal-foreground": "hsl(var(--terminal-foreground))",
        "tab-active": "hsl(var(--tab-active))",
        "tab-inactive": "hsl(var(--tab-inactive))",
        "status-bar": "hsl(var(--status-bar))",
      },
      fontFamily: {
        mono: ["Menlo", "Monaco", "Courier New", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
