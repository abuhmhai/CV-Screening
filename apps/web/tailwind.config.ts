import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--colors-primary)",
          active: "var(--colors-primary-active)",
          neutral: "var(--colors-primary-neutral)",
          pale: "var(--colors-primary-pale)"
        },
        canvas: {
          DEFAULT: "var(--colors-canvas)",
          soft: "var(--colors-canvas-soft)"
        },
        ink: {
          DEFAULT: "var(--colors-ink)",
          deep: "var(--colors-ink-deep)"
        },
        body: "var(--colors-body)",
        mute: "var(--colors-mute)",
        positive: {
          DEFAULT: "var(--colors-positive)",
          deep: "var(--colors-positive-deep)"
        },
        warning: {
          DEFAULT: "var(--colors-warning)",
          deep: "var(--colors-warning-deep)",
          content: "var(--colors-warning-content)"
        },
        negative: {
          DEFAULT: "var(--colors-negative)",
          deep: "var(--colors-negative-deep)",
          darkest: "var(--colors-negative-darkest)",
          bg: "var(--colors-negative-bg)"
        },
        "accent-orange": "var(--colors-accent-orange)",
        "accent-cyan": "var(--colors-accent-cyan)",
        "on-primary": "var(--colors-on-primary)"
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
      spacing: {
        xxs: "var(--spacing-xxs)",
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
        "3xl": "var(--spacing-3xl)"
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "Inter", "system-ui", "sans-serif"]
      },
      fontSize: {
        "display-mega": [
          "var(--typography-display-mega-size)",
          { lineHeight: "var(--typography-display-mega-line-height)", fontWeight: "900" }
        ],
        "display-xxl": [
          "var(--typography-display-xxl-size)",
          { lineHeight: "var(--typography-display-xxl-line-height)", fontWeight: "900" }
        ],
        "display-xl": [
          "var(--typography-display-xl-size)",
          { lineHeight: "var(--typography-display-xl-line-height)", fontWeight: "900" }
        ],
        "display-md": [
          "var(--typography-display-md-size)",
          { lineHeight: "var(--typography-display-md-line-height)", fontWeight: "900" }
        ],
        "display-sm": [
          "var(--typography-display-sm-size)",
          { lineHeight: "var(--typography-display-sm-line-height)", fontWeight: "600" }
        ],
        "display-xs": [
          "var(--typography-display-xs-size)",
          { lineHeight: "var(--typography-display-xs-line-height)", fontWeight: "600" }
        ],
        "body-lg": [
          "var(--typography-body-lg-size)",
          { lineHeight: "var(--typography-body-lg-line-height)", fontWeight: "400" }
        ],
        "body-md": [
          "var(--typography-body-md-size)",
          { lineHeight: "var(--typography-body-md-line-height)", fontWeight: "400" }
        ],
        "body-sm": [
          "var(--typography-body-sm-size)",
          { lineHeight: "var(--typography-body-sm-line-height)", fontWeight: "400" }
        ],
        "button-md": [
          "var(--typography-button-md-size)",
          { lineHeight: "var(--typography-button-md-line-height)", fontWeight: "600" }
        ],
        caption: [
          "var(--typography-caption-size)",
          { lineHeight: "var(--typography-caption-line-height)", fontWeight: "400" }
        ]
      },
      maxWidth: {
        container: "1200px"
      },
      transitionDuration: {
        250: "250ms"
      }
    }
  },
  plugins: []
};

export default config;
