// JS-runtime mirror of CSS tokens from src/app/globals.css for contexts that
// cannot read CSS variables (next/og ImageResponse, Next viewport.themeColor).
// Keep in sync with globals.css.
export const designTokens = {
  themeColor: {
    light: "#fcfbf1",
    dark: "#111111",
  },
  brand: {
    primary: "#566582",
    primaryForeground: "#ffffff",
  },
} as const;
