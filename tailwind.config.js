/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ─── Colores dinámicos del ThemeProvider (CSS variables) ───
        primary:   "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent:    "var(--color-accent)",

        // ─── Material You tokens (estáticos, para compatibilidad con Stitch) ───
        "on-error-container": "#ffdad6",
        "on-primary": "#381e72",
        "tertiary-container": "#c9a74d",
        "tertiary-fixed-dim": "#e7c365",
        "surface-container": "#211f24",
        "surface-variant": "#36343a",
        "surface-dim": "#141218",
        "on-surface": "#e6e0e9",
        "outline": "#948e9c",
        "surface-bright": "#3b383e",
        "primary-fixed": "#e9ddff",
        "on-primary-fixed": "#22005d",
        "on-surface-variant": "#cbc4d2",
        "secondary-fixed": "#e9ddff",
        "error": "#ffb4ab",
        "on-tertiary-container": "#503d00",
        "surface-container-high": "#2b292f",
        "on-secondary": "#342b4b",
        "outline-variant": "#494551",
        "on-tertiary-fixed-variant": "#594400",
        "error-container": "#93000a",
        "inverse-surface": "#e6e0e9",
        "on-tertiary": "#3e2e00",
        "tertiary-fixed": "#ffdf93",
        "secondary-fixed-dim": "#cdc0e9",
        "surface-container-highest": "#36343a",
        "surface-container-low": "#1d1b20",
        "on-error": "#690005",
        "tertiary": "#e7c365",
        "background": "#141218",
        "inverse-primary": "#6750a4",
        "on-primary-container": "#e0d2ff",
        "on-secondary-fixed-variant": "#4b4263",
        "surface": "#141218",
        "primary-fixed-dim": "#cfbcff",
        "on-secondary-container": "#bfb2da",
        "surface-tint": "#cfbcff",
        "on-background": "#e6e0e9",
        "inverse-on-surface": "#322f35",
        "on-tertiary-fixed": "#241a00",
        "primary-container": "#6750a4",
        "on-primary-fixed-variant": "#4f378a",
        "on-secondary-fixed": "#1f1635",
        "secondary-container": "#4d4465",
        "surface-container-lowest": "#0f0d13"
      },
      // ─── Restaurado el scale completo de border-radius ───
      borderRadius: {
        sm:    "0.125rem",
        DEFAULT: "0.25rem",
        md:    "0.375rem",
        lg:    "0.5rem",
        xl:    "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        full:  "9999px",
      },
      spacing: {
        "container-padding": "24px",
        "stack-lg": "32px",
        "stack-md": "16px",
        "stack-sm": "8px",
        "gutter": "16px",
        "unit": "8px"
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        "h2": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        "display": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        "label-caps": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        "body-md": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        "h1": ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        "body-lg": ["Plus Jakarta Sans", "system-ui", "sans-serif"]
      },
      fontSize: {
        "h2": ["24px", { lineHeight: "1.3", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display": ["48px", { lineHeight: "1.1", letterSpacing: "-0.04em", fontWeight: "800" }],
        "label-caps": ["12px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "700" }],
        "body-md": ["16px", { lineHeight: "1.6", letterSpacing: "-0.01em", fontWeight: "400" }],
        "h1": ["32px", { lineHeight: "1.2", letterSpacing: "-0.03em", fontWeight: "700" }],
        "body-lg": ["18px", { lineHeight: "1.6", letterSpacing: "-0.01em", fontWeight: "400" }]
      }
    }
  },
  plugins: [],
}
