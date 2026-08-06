import type { Config } from "tailwindcss";

// Design tokens per Taxus SRS Volume 2 — User Experience & UI/UX Design System.
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        primary: {
          900: "#1F3864",
          700: "#2F5496",
          500: "#4472C4",
          100: "#DCE6F5",
        },
        neutral: {
          900: "#1A1F29",
          700: "#4B5563",
          400: "#9CA3AF",
          200: "#E5E7EB",
          100: "#F3F4F6",
          0: "#FFFFFF",
        },
        status: {
          success: "#2E9E6C",
          warning: "#D97706",
          danger: "#DC2626",
          info: "#2563EB",
          neutral: "#6B7280",
        },
        ai: {
          DEFAULT: "#7C4DFF",
          500: "#7C4DFF",
        },
        border: "#E5E7EB",
        background: "#F3F4F6",
        surface: "#FFFFFF",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "12px",
        full: "9999px",
      },
      boxShadow: {
        elevation1: "0 1px 2px rgba(16,24,40,0.06)",
        elevation2: "0 4px 8px rgba(16,24,40,0.10)",
        elevation3: "0 12px 24px rgba(16,24,40,0.16)",
        elevation4: "0 20px 40px rgba(16,24,40,0.24)",
      },
    },
  },
  plugins: [],
};

export default config;
