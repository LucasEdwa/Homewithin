import { Platform } from "react-native";

export const Colors = {
  // ── Backgrounds ───────────────────────────────────────────
  warmWhite: "#0F0D0C", // main screen background
  softGray: "#1C1816", // default card / surface

  // ── Brand accents ─────────────────────────────────────────
  safeBlue: "#6B7280",
  softGreen: "#7BC9A7",
  mutedLavender: "#B8A8E3",
  alertRed: "#D9534F",
  warmAmber: "#E07B53", // status / warning accent (Oura-style)

  // ── Text ──────────────────────────────────────────────────
  textPrimary: "#FFFFFF",
  textSecondary: "#9A9A9A",
  textMuted: "#555555",
  textOnDark: "#FFFFFF",

  // ── Borders ───────────────────────────────────────────────
  border: "rgba(255,255,255,0.08)",

  // ── Safety states ─────────────────────────────────────────
  safetyGreen: "#7BC9A7",
  safetyYellow: "#F5C842",
  safetyRed: "#D9534F",

  // ── Overlays ──────────────────────────────────────────────
  overlay: "rgba(15, 13, 12, 0.88)",

  // ── Pure values ───────────────────────────────────────────
  white: "#FFFFFF",
  black: "#000000",

  background: "#0F0D0C",
  cardBackground: "#1C1816",
} as const;

// Adaptive light/dark colors used by Expo scaffold components
// (ThemedText, ThemedView, Collapsible, use-theme-color hook).
export const AdaptiveColors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: "#0a7ea4",
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: "#0a7ea4",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: "#fff",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#fff",
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
