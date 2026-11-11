import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#182c2d",
        "primary-container": "#2e4243",
        secondary: "#705c1a",
        "secondary-soft": "#fadd8e",
        gold: "#cfb56a",
        surface: "#ffffff",
        "surface-dim": "#f7f8f6",
        "surface-container": "#f0f2ef",
        "surface-container-high": "#e6e9e4",
        "on-surface": "#0f1e1f",
        "on-surface-variant": "#424848",
        outline: "#727878",
        "outline-variant": "#e1e4e2",
        error: "#ba1a1a",
        "error-container": "#ffdad6",
        success: "#2f5d45",
      },
      fontFamily: {
        serif: ["var(--font-bodoni)", "Bodoni Moda", "Georgia", "serif"],
        sans: ["var(--font-hanken)", "Hanken Grotesk", "system-ui", "sans-serif"],
      },
      fontSize: {
        "label-xs": ["0.625rem", { lineHeight: "1.2", letterSpacing: "0.15em" }],
        label: ["0.6875rem", { lineHeight: "1.2", letterSpacing: "0.15em" }],
        "display-lg": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-sm": ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        "headline-lg": ["2.4rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "headline-md": ["2rem", { lineHeight: "1.25" }],
        "headline-sm": ["1.25rem", { lineHeight: "1.35" }],
        "body-lg": ["1.125rem", { lineHeight: "1.65" }],
        "body-md": ["0.9375rem", { lineHeight: "1.6" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.55" }],
      },
      maxWidth: {
        canvas: "1440px",
      },
      letterSpacing: {
        editorial: "0.18em",
      },
      transitionDuration: {
        250: "250ms",
      },
    },
  },
  plugins: [],
};

export default config;
