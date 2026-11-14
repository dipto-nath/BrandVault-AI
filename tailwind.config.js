/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        // Navy palette
        navy: {
          900: "#0D1117",
          800: "#161D2A",
          700: "#1B2535",
          600: "#1E2C40",
          500: "#253349",
          400: "#2F4060",
          300: "#3D5478",
        },
        // Gold palette
        gold: {
          500: "#C9A84C",
          400: "#D4B56A",
          300: "#E0CA94",
        },
        // Semantic tokens (for Tailwind classes)
        base: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          subtle:  "var(--surface-subtle)",
          hover:   "var(--surface-hover)",
        },
        ink: {
          dark:      "var(--ink-dark)",
          DEFAULT:   "var(--ink)",
          secondary: "var(--ink-secondary)",
          muted:     "var(--ink-muted)",
        },
        border: { DEFAULT: "var(--border)", soft: "var(--border-soft)" },
        accent: {
          DEFAULT: "var(--accent)",
          hover:   "var(--accent-hover)",
          soft:    "var(--accent-soft)",
        },
        critical: { DEFAULT: "var(--critical)", soft: "var(--critical-soft)" },
        warning:  { DEFAULT: "var(--warning)",  soft: "var(--warning-soft)"  },
        success:  { DEFAULT: "var(--success)",  soft: "var(--success-soft)"  },
      },
      borderRadius: {
        xs:  "4px",
        sm:  "6px",
        DEFAULT: "8px",
        md:  "10px",
        lg:  "14px",
        xl:  "20px",
        full:"9999px",
      },
      fontFamily: {
        sans:    ["var(--font-geist)",      "system-ui", "sans-serif"],
        serif:   ["var(--font-newsreader)", "Georgia",   "serif"],
        jakarta: ["var(--font-jakarta)",    "system-ui", "sans-serif"],
        rounded: ["var(--font-rounded)",    "sans-serif"],
        outfit:  ["var(--font-outfit)",     "sans-serif"],
      },
      fontSize: {
        xs:   ["0.75rem",   { lineHeight: "1.4" }],
        sm:   ["0.875rem",  { lineHeight: "1.5" }],
        base: ["1rem",      { lineHeight: "1.6" }],
        lg:   ["1.125rem",  { lineHeight: "1.55" }],
        xl:   ["1.25rem",   { lineHeight: "1.5" }],
        "2xl":["1.5rem",    { lineHeight: "1.4" }],
        "3xl":["1.875rem",  { lineHeight: "1.3" }],
      },
      boxShadow: {
        sm:   "0 1px 3px rgba(0,0,0,0.3)",
        DEFAULT:"0 4px 12px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
        md:   "0 8px 24px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)",
        gold: "0 0 20px rgba(201,168,76,0.25)",
      },
      animation: {
        "fade-in":      "fadeIn 0.2s ease-out",
        "slide-up":     "slideUp 0.3s ease-out",
        "fade-in-fast": "fadeIn 0.12s ease-out",
      },
      keyframes: {
        fadeIn:  { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
    },
  },
  plugins: [],
};
