/** Built-in Mermaid themes, in the order they appear in the picker. */
export const THEMES = ["default", "dark", "forest", "neutral"] as const;

export type Theme = (typeof THEMES)[number];

export const isTheme = (value: string): value is Theme =>
  (THEMES as readonly string[]).includes(value);

export const THEME_LABELS: Record<Theme, string> = {
  default: "Default",
  dark: "Dark",
  forest: "Forest",
  neutral: "Neutral",
};
