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
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        ink: {
          dark: "#17212B",
          DEFAULT: "#20272E",
          secondary: "#727A80",
        },
        surface: {
          base: "#F6F6F2",
          paper: "#FFFFFF",
          subtle: "#E9EEE8",
        },
        border: {
          DEFAULT: "#E3E5E1",
        },
        accent: {
          DEFAULT: "#526B5B",
          soft: "#E9EEE8",
        },
        critical: "#B54B48",
        warning: "#B17C36",
        success: "#52795F",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "10px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      spacing: {
        0: "0px",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        5: "20px",
        6: "24px",
        8: "32px",
        10: "40px",
        12: "48px",
        16: "64px",
        20: "80px",
        24: "96px",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.4" }],
        sm: ["0.875rem", { lineHeight: "1.5" }],
        base: ["1rem", { lineHeight: "1.6" }],
        lg: ["1.125rem", { lineHeight: "1.55" }],
        xl: ["1.25rem", { lineHeight: "1.5" }],
        "2xl": ["1.5rem", { lineHeight: "1.45" }],
        "3xl": ["2rem", { lineHeight: "1.3" }],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(23 33 43 / 0.04)",
        DEFAULT: "0 1px 3px 0 rgb(23 33 43 / 0.06), 0 1px 2px -1px rgb(23 33 43 / 0.04)",
        md: "0 4px 6px -1px rgb(23 33 43 / 0.06), 0 2px 4px -2px rgb(23 33 43 / 0.06)",
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "fade-in-fast": "fadeIn 0.12s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};