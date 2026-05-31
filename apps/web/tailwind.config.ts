import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--colors-primary)",
        "primary-active": "var(--colors-primary-active)",
        "primary-neutral": "var(--colors-primary-neutral)",
        "primary-pale": "var(--colors-primary-pale)",
        canvas: "var(--colors-canvas)",
        "canvas-soft": "var(--colors-canvas-soft)",
        ink: "var(--colors-ink)",
        "ink-deep": "var(--colors-ink-deep)",
        body: "var(--colors-body)",
        mute: "var(--colors-mute)",
        positive: "var(--colors-positive)",
        "positive-deep": "var(--colors-positive-deep)",
        warning: "var(--colors-warning)",
        "warning-deep": "var(--colors-warning-deep)",
        "warning-content": "var(--colors-warning-content)",
        negative: "var(--colors-negative)",
        "negative-deep": "var(--colors-negative-deep)",
        "negative-darkest": "var(--colors-negative-darkest)",
        "negative-bg": "var(--colors-negative-bg)",
        "accent-orange": "var(--colors-accent-orange)",
        "accent-cyan": "var(--colors-accent-cyan)"
      },
      borderRadius: {
        none: "var(--rounded-none)",
        sm: "var(--rounded-sm)",
        md: "var(--rounded-md)",
        lg: "var(--rounded-lg)",
        xl: "var(--rounded-xl)",
        pill: "var(--rounded-pill)",
        full: "var(--rounded-full)"
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"]
      },
      fontSize: {
        "display-mega": ["var(--typography-display-mega-size)", { lineHeight: "var(--typography-display-mega-line-height)", fontWeight: "900" }],
        "display-xxl": ["var(--typography-display-xxl-size)", { lineHeight: "var(--typography-display-xxl-line-height)", fontWeight: "900" }],
        "display-xl": ["var(--typography-display-xl-size)", { lineHeight: "var(--typography-display-xl-line-height)", fontWeight: "900" }],
        "display-md": ["var(--typography-display-md-size)", { lineHeight: "var(--typography-display-md-line-height)", fontWeight: "900" }],
        "display-sm": ["var(--typography-display-sm-size)", { lineHeight: "var(--typography-display-sm-line-height)", fontWeight: "600" }],
        "body-md": ["var(--typography-body-md-size)", { lineHeight: "var(--typography-body-md-line-height)", fontWeight: "400" }],
        "button-md": ["var(--typography-button-md-size)", { lineHeight: "var(--typography-button-md-line-height)", fontWeight: "600" }]
      }
    }
  },
  plugins: []
};

export default config;
