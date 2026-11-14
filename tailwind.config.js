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
        // BrandVault AI Design System - Enterprise Palette
        navy: {
          950: "#0A101D",
          900: "#101B2D",  // Primary navy
          800: "#152139",
          700: "#1D2B45",  // Secondary navy
          600: "#263856",
          500: "#344A6D",
          400: "#48638E",
          300: "#6480AF",
        },
        gold: {
          500: "#C49A55",  // Gold accent
          400: "#D4AC6A",
          300: "#E2C18E",
        },
        // Semantic tokens
        background: "var(--background)",
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
        lg:  "12px",
        xl:  "16px",
        "2xl": "20px",
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
        xs:   ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],     // 11px - metadata
        sm:   ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],    // 13px - body
        base: ["0.875rem",  { lineHeight: "1.55", letterSpacing: "0" }],         // 14px - body
        lg:   ["0.9375rem", { lineHeight: "1.5", letterSpacing: "0" }],          // 15px
        xl:   ["1.0625rem", { lineHeight: "1.45", letterSpacing: "-0.01em" }],   // 17px - section heading
        "2xl": ["1.25rem",  { lineHeight: "1.4", letterSpacing: "-0.015em" }],   // 20px - section heading
        "3xl": ["1.625rem", { lineHeight: "1.3", letterSpacing: "-0.02em" }],    // 26px - page title
        "4xl": ["2rem",     { lineHeight: "1.25", letterSpacing: "-0.02em" }],   // 32px
        "5xl": ["2.5rem",   { lineHeight: "1.2", letterSpacing: "-0.02em" }],    // 40px
      },
      spacing: {
        "18": "4.5rem",   // 72px
        "22": "5.5rem",   // 88px
        "30": "7.5rem",   // 120px
      },
      boxShadow: {
        sm:   "0 1px 2px rgba(16, 27, 45, 0.04), 0 1px 3px rgba(16, 27, 45, 0.06)",
        DEFAULT: "0 1px 3px rgba(16, 27, 45, 0.05), 0 4px 8px rgba(16, 27, 45, 0.04)",
        md:   "0 4px 12px rgba(16, 27, 45, 0.06), 0 2px 4px rgba(16, 27, 45, 0.04)",
        lg:   "0 8px 24px rgba(16, 27, 45, 0.08), 0 4px 8px rgba(16, 27, 45, 0.05)",
        xl:   "0 16px 48px rgba(16, 27, 45, 0.1), 0 8px 16px rgba(16, 27, 45, 0.06)",
        card: "0 1px 3px rgba(16, 27, 45, 0.04), 0 4px 12px rgba(16, 27, 45, 0.03)",
        "card-hover": "0 4px 16px rgba(16, 27, 45, 0.06), 0 2px 6px rgba(16, 27, 45, 0.04)",
      },
      animation: {
        "fade-in":      "fadeIn 0.2s ease-out",
        "slide-up":     "slideUp 0.3s ease-out",
        "fade-in-fast": "fadeIn 0.12s ease-out",
        "slide-down":   "slideDown 0.2s ease-out",
      },
      keyframes: {
        fadeIn:     { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:    { "0%": { opacity: "0", transform: "translateY(6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideDown:  { "0%": { opacity: "0", transform: "translateY(-6px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
      },
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
