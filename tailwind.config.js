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
        // BrandVault AI — Warm Reading Room Palette
        background: "var(--paper)",
        paper: "var(--paper)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        "surface-hover": "var(--surface-hover)",
        line: "var(--line)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        "ink-3": "var(--ink-3)",
        brand: "var(--brand)",
        "brand-hover": "var(--brand-hover)",
        "brand-soft": "var(--brand-soft)",
        terracotta: "var(--terracotta)",
        supported: "var(--supported)",
        "supported-soft": "var(--supported-soft)",
        "supported-border": "var(--supported-border)",
        unverified: "var(--unverified)",
        "unverified-soft": "var(--unverified-soft)",
        "unverified-border": "var(--unverified-border)",
        contradicted: "var(--contradicted)",
        "contradicted-soft": "var(--contradicted-soft)",
        "contradicted-border": "var(--contradicted-border)",
        outdated: "var(--outdated)",
        "outdated-soft": "var(--outdated-soft)",
        "outdated-border": "var(--outdated-border)",
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
        handwritten: ["var(--font-caveat)", "cursive"],
      },
      fontSize: {
        xs: ["0.6875rem", { lineHeight: "1.4", letterSpacing: "0.02em" }],     // 11px - metadata
        sm: ["0.8125rem", { lineHeight: "1.5", letterSpacing: "0.01em" }],    // 13px - body
        base: ["0.9375rem", { lineHeight: "1.6", letterSpacing: "0" }],         // 15px - body
        lg: ["1rem", { lineHeight: "1.5", letterSpacing: "0" }],          // 16px
        xl: ["1.125rem", { lineHeight: "1.45", letterSpacing: "-0.01em" }],   // 18px - section heading
        "2xl": ["1.5rem", { lineHeight: "1.4", letterSpacing: "-0.01em" }],   // 24px - section heading
        "3xl": ["2.25rem", { lineHeight: "1.25", letterSpacing: "-0.01em" }],   // 36px - page title
        "4xl": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],   // 40px
      },
      spacing: {
        "18": "4.5rem",   // 72px
        "22": "5.5rem",   // 88px
        "30": "7.5rem",   // 120px
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        lg: "var(--shadow-lg)",
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
