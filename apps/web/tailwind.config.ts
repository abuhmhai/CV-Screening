import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "../../packages/ui/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "var(--colors-primary)",
          on: "var(--colors-primary-on)",
          active: "var(--colors-primary-active)",
          neutral: "var(--colors-primary-neutral)",
          pale: "var(--colors-primary-pale)",
        },
        "on-primary": "var(--colors-on-primary)",
        surface: {
          light: "var(--colors-surface-light)",
          card: "var(--colors-surface-card)",
          elevated: "var(--colors-surface-elevated)",
          deep: "var(--colors-surface-deep)",
        },
        canvas: {
          DEFAULT: "var(--colors-canvas)",
          soft: "var(--colors-canvas-soft)",
        },
        hairline: {
          DEFAULT: "var(--colors-hairline)",
          strong: "var(--colors-hairline-strong)",
        },
        divider: {
          soft: "var(--colors-divider-soft)",
        },
        ink: {
          DEFAULT: "var(--colors-ink)",
          deep: "var(--colors-ink-deep)",
        },
        body: "var(--colors-body)",
        charcoal: "var(--colors-charcoal)",
        mute: "var(--colors-mute)",
        ash: "var(--colors-ash)",
        stone: "var(--colors-stone)",
        "on-light": {
          DEFAULT: "var(--colors-on-light)",
          mute: "var(--colors-on-light-mute)",
        },
        accent: {
          orange: "var(--colors-accent-orange)",
          "orange-glow": "var(--colors-accent-orange-glow)",
          yellow: "var(--colors-accent-yellow)",
          blue: "var(--colors-accent-blue)",
          "blue-glow": "var(--colors-accent-blue-glow)",
          green: "var(--colors-accent-green)",
          "green-glow": "var(--colors-accent-green-glow)",
          red: "var(--colors-accent-red)",
          "red-glow": "var(--colors-accent-red-glow)",
        },
        link: "var(--colors-link)",
        positive: {
          DEFAULT: "var(--colors-positive)",
          deep: "var(--colors-positive-deep)",
        },
        negative: "var(--colors-negative)",
        warning: "var(--colors-warning)",
      },
      borderRadius: {
        none: "var(--rounded-none)",
        xs: "var(--rounded-xs)",
        sm: "var(--rounded-sm)",
        md: "var(--rounded-md)",
        lg: "var(--rounded-lg)",
        xl: "var(--rounded-xl)",
        full: "var(--rounded-full)"
      },
      spacing: {
        xxs: "var(--spacing-xxs)",
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        xxl: "var(--spacing-xxl)",
        xxxl: "var(--spacing-xxxl)",
        section: "var(--spacing-section)",
        band: "var(--spacing-band)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        marketing: ["var(--font-marketing)"],
        ui: ["var(--font-ui)"],
        mono: ["var(--font-code)"]
      },
      fontSize: {
        "display-xxl": [
          "var(--typography-display-xxl-size)",
          { lineHeight: "var(--typography-display-xxl-line-height)", fontWeight: "400", letterSpacing: "-0.01em" }
        ],
        "display-xl": [
          "var(--typography-display-xl-size)",
          { lineHeight: "var(--typography-display-xl-line-height)", fontWeight: "400", letterSpacing: "-0.01em" }
        ],
        "display-lg": [
          "var(--typography-display-lg-size)",
          { lineHeight: "var(--typography-display-lg-line-height)", fontWeight: "400", letterSpacing: "-0.05em" }
        ],
        "heading-md": [
          "var(--typography-heading-md-size)",
          { lineHeight: "var(--typography-heading-md-line-height)", fontWeight: "500", letterSpacing: "-0.016em" }
        ],
        "heading-sm": [
          "var(--typography-heading-sm-size)",
          { lineHeight: "var(--typography-heading-sm-line-height)", fontWeight: "500", letterSpacing: "-0.015em" }
        ],
        subtitle: [
          "var(--typography-subtitle-size)",
          { lineHeight: "var(--typography-subtitle-line-height)", fontWeight: "400" }
        ],
        "body-lg": [
          "var(--typography-body-lg-size)",
          { lineHeight: "var(--typography-body-lg-line-height)", fontWeight: "400" }
        ],
        "body-md": [
          "var(--typography-body-md-size)",
          { lineHeight: "var(--typography-body-md-line-height)", fontWeight: "400", letterSpacing: "-0.05em" }
        ],
        "body-sm": [
          "var(--typography-body-sm-size)",
          { lineHeight: "var(--typography-body-sm-line-height)", fontWeight: "400" }
        ],
        "button-md": [
          "var(--typography-button-md-size)",
          { lineHeight: "var(--typography-button-md-line-height)", fontWeight: "500" }
        ],
        "button-sm": [
          "var(--typography-button-sm-size)",
          { lineHeight: "var(--typography-button-sm-line-height)", fontWeight: "500", letterSpacing: "0.025em" }
        ],
        caption: [
          "var(--typography-caption-size)",
          { lineHeight: "var(--typography-caption-line-height)", fontWeight: "400" }
        ],
        "caption-emph": [
          "var(--typography-caption-emph-size)",
          { lineHeight: "var(--typography-caption-emph-line-height)", fontWeight: "600" }
        ],
        "code-md": [
          "var(--typography-code-md-size)",
          { lineHeight: "var(--typography-code-md-line-height)", fontWeight: "400" }
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