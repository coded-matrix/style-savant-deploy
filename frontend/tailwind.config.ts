import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // ── Style Savant consumer design system (Modern Afro-Surrealist) ──
        // ── Monochrome editorial system — old brand names remapped in place ──
        // (teal/coral kept as class names so existing markup works; both are ink now)
        teal: {
          DEFAULT: "#141414", // ink — primary actions
          deep: "#0A0A0A",
          container: "#1F1F1D",
          on: "#FFFFFF",
          dim: "#3A3A37",
          50: "#F4F3F0",
          100: "#EDEBE6",
        },
        coral: {
          DEFAULT: "#141414", // ink — CTAs, active states
          bright: "#2B2B28", // hover/pressed
          on: "#ffffff",
          deep: "#0A0A0A",
          50: "#EDEBE6",
          100: "#E4E1DB",
        },
        clay: "#6E6B65", // graphite tertiary
        "clay-container": "#8A8680",
        "clay-fixed": "#EDEBE6",
        "off-white": "#FAF9F7", // rank feed
        "studio-black": "#000000", // studio feed
        "dark-grey": "#1A1A19",
        "mid-grey": "#6E6B65", // warm graphite — secondary text
        "surface-bright": "#F4F3F0", // bone paper — page background
        ink: "#141414", // near-black — text, primary CTAs
        "ink-variant": "#3A3A37",
        line: "#E4E1DB", // soft stone hairline
        "surface-dim": "#DDDAD3",
        "surface-lowest": "#FFFFFF",
        "surface-low": "#EFEDE8",
        surface: "#EAE8E2",
        "surface-high": "#E4E1DB",
        "surface-highest": "#DDDAD3",
        "surface-variant": "#DDDAD3",
        "on-primary": "#FFFFFF",
        "on-secondary": "#FFFFFF",
        error: "#BA1A1A",
        warn: "#C98A1A",
        success: "#1F9D6B",
        // ── Style Savant Vendor Portal design tokens ──
        "vendor-primary": "#141414",
        "vendor-container": "#1F1F1D",
        "vendor-coral": "#141414",
        "vendor-coral-bright": "#141414",
        "vendor-success": "#1F9D6B",
        "vendor-danger": "#BA1A1A",
        "vendor-surface-dark": "#1A1A18",
        "vendor-canvas": "#F4F3F0",
        "vendor-text-grey": "#6E6B65",
        "vendor-teal-tint": "rgba(20,20,20,0.03)",
        "vendor-red-tint": "rgba(186,26,26,0.08)",
        "vendor-amber": "#C98A1A",
        "vendor-amber-tint": "rgba(201,138,26,0.08)",
        // ── Dark-mode neutral surfaces (centralized; replaces inline hex) ──
        "surface-dark": "#1A1A18", // dark card/panel surface
        "canvas-dark": "#0F0F0E", // dark app/page background
        "onboard-dark": "#0D0D0C", // onboarding dark background
        // ── Avatar/thumbnail placeholder gradient stops ──
        "thumb-1a": "#2B2B28", "thumb-1b": "#4A4843",
        "thumb-2a": "#3A3A36", "thumb-2b": "#56544E",
        "thumb-3a": "#232321", "thumb-3b": "#3F3D38",
        "thumb-4a": "#45433E", "thumb-4b": "#5E5B54",
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        body: ["var(--font-hanken)", "Hanken Grotesk", "system-ui", "sans-serif"],
        sans: ["var(--font-hanken)", "Hanken Grotesk", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Cormorant Garamond", "Georgia", "serif"],
        ubuntu: ["var(--font-ubuntu)", "Ubuntu Condensed", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-2xl": ["40px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-xl": ["28px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["26px", { lineHeight: "32px", fontWeight: "700" }],
        "headline-md": ["22px", { lineHeight: "28px", fontWeight: "700" }],
        "title-lg": ["20px", { lineHeight: "26px", fontWeight: "700" }],
        "title-md": ["18px", { lineHeight: "24px", fontWeight: "700" }],
        "body-lg-bold": ["16px", { lineHeight: "24px", fontWeight: "700" }],
        "body-md": ["14px", { lineHeight: "20px" }],
        "body-d": ["15px", { lineHeight: "24px" }],
        "label-bold": ["13px", { lineHeight: "18px", fontWeight: "700" }],
        caption: ["12px", { lineHeight: "16px" }],
        micro: ["10px", { lineHeight: "14px", letterSpacing: "0.05em" }],
        // ── Vendor Portal type scale (editorial — large, bold, business) ──
        "v-hero": ["36px", { lineHeight: "40px", fontWeight: "700" }],
        // Weight-agnostic: headings using this set their own weight via font-*
        // utilities (bold on mobile, light on desktop). Baking a weight here
        // would defeat an lg:font-normal override at the xl breakpoint.
        "v-hero-d": ["44px", { lineHeight: "48px", letterSpacing: "-0.02em" }],
        "v-hlg": ["28px", { lineHeight: "32px", fontWeight: "700" }],
        "v-hlg-m": ["24px", { lineHeight: "30px", fontWeight: "700" }],
        "v-hmd": ["18px", { lineHeight: "26px", fontWeight: "700" }],
        "v-title": ["16px", { lineHeight: "22px", fontWeight: "700" }],
        "v-tsm": ["14px", { lineHeight: "20px", fontWeight: "700" }],
        "v-body": ["14px", { lineHeight: "22px" }],
        "v-body-d": ["15px", { lineHeight: "24px" }],
        "v-cap": ["12px", { lineHeight: "18px" }],
        "v-meta": ["12px", { lineHeight: "18px" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        input: "12px",
        card: "16px",
        sheet: "24px",
        pill: "9999px",
      },
      spacing: {
        "btn-lg": "52px",
        "btn-md": "48px",
        "btn-d": "44px",
        "page-x": "24px",
        "card-x": "12px",
        "gutter": "8px",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "0.3", transform: "scale(0.8)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-dot-1": {
          "0%, 100%": { transform: "scale(0.5)", opacity: "0.5" },
          "50%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-dot-2": {
          "0%, 100%": { transform: "scale(0.5)", opacity: "0.5" },
          "50%": { transform: "scale(1)", opacity: "1" },
        },
        "pulse-dot-3": {
          "0%, 100%": { transform: "scale(0.5)", opacity: "0.5" },
          "50%": { transform: "scale(1)", opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "shimmer": {
          "100%": { transform: "translateX(100%)" },
        },
        "pop": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.35)" },
          "100%": { transform: "scale(1)" },
        },
        "shake": {
          "10%, 90%": { transform: "translateX(-1px)" },
          "20%, 80%": { transform: "translateX(2px)" },
          "30%, 50%, 70%": { transform: "translateX(-4px)" },
          "40%, 60%": { transform: "translateX(4px)" },
        },
        "confetti-fall": {
          "0%": { transform: "translateY(-10%) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(120%) rotate(360deg)", opacity: "0" },
        },
        "reveal-sweep": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(400%)" },
        },
        // Try-on attention cues. The motion is squeezed into the tail of each
        // cycle so the button rests most of the time — continuous movement
        // beside a playing video reads as a stuck spinner and gets ignored.
        "tryon-nudge": {
          "0%, 82%, 100%": { transform: "rotate(0deg) scale(1)" },
          "85%": { transform: "rotate(-7deg) scale(1.06)" },
          "88%": { transform: "rotate(6deg) scale(1.06)" },
          "91%": { transform: "rotate(-4deg) scale(1.04)" },
          "94%": { transform: "rotate(3deg) scale(1.02)" },
          "97%": { transform: "rotate(0deg) scale(1)" },
        },
        // Glow rides its own element: animating box-shadow on the button
        // itself fights Tailwind's `shadow-*` custom properties.
        "tryon-halo": {
          "0%, 78%, 100%": { opacity: "0", transform: "scale(0.85)" },
          "88%": { opacity: "0.85", transform: "scale(1.35)" },
        },
        "tryon-sheen": {
          "0%, 78%, 100%": { transform: "translateX(-140%) skewX(-20deg)" },
          "92%": { transform: "translateX(140%) skewX(-20deg)" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 600ms ease-in-out infinite",
        "pulse-dot-1": "pulse-dot-1 1.5s ease-in-out 0s infinite",
        "pulse-dot-2": "pulse-dot-2 1.5s ease-in-out 0.2s infinite",
        "pulse-dot-3": "pulse-dot-3 1.5s ease-in-out 0.4s infinite",
        "scale-in": "scale-in 300ms ease-out",
        "slide-up": "slide-up 320ms cubic-bezier(0.22,1,0.36,1)",
        "fade-in": "fade-in 250ms ease-out",
        "shimmer": "shimmer 1.6s infinite",
        "pop": "pop 360ms ease-out",
        "shake": "shake 420ms cubic-bezier(0.36,0.07,0.19,0.97)",
        "confetti": "confetti-fall 1.2s ease-in forwards",
        "reveal-sweep": "reveal-sweep 1.8s ease-in-out infinite",
        "tryon-nudge": "tryon-nudge 5s cubic-bezier(0.36,0.07,0.19,0.97) infinite",
        "tryon-sheen": "tryon-sheen 5s ease-in-out infinite",
        "tryon-halo": "tryon-halo 5s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
