/**
 * Theme color scheme registry.
 * Each theme defines semantic color tokens that can replace all matching
 * element colors on the canvas in one click.
 *
 * Tokens: primary, accent, text, background, sticker
 * Application: find elements with colors matching old theme values → replace with new.
 */

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  /** Semantic color token → hex color */
  colors: {
    primary: string; // 主色/强调色
    accent: string; // 辅助强调
    text: string; // 正文文字
    background: string; // 背景色
  };
  /** Visual preview swatches */
  swatches?: string[];
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'ecommerce_high_contrast',
    name: '带货高对比',
    description: '高饱和强对比，适合促销带货场景',
    colors: {
      primary: '#ff4d4f', // 强红
      accent: '#fa8c16', // 橙色
      text: '#1f1f1f', // 深黑文字
      background: '#fff3e8', // 暖白背景
    },
    swatches: ['#ff4d4f', '#fa8c16', '#1f1f1f', '#fff3e8'],
  },
  {
    id: 'store_review_fresh',
    name: '探店清新',
    description: '清新自然配色，适合探店打卡分享',
    colors: {
      primary: '#52c41a', // 清新绿
      accent: '#73d13d', // 浅绿
      text: '#389e0d', // 深绿文字
      background: '#f6ffed', // 极浅绿背景
    },
    swatches: ['#52c41a', '#73d13d', '#389e0d', '#f6ffed'],
  },
  {
    id: 'night_neon',
    name: '夜景霓虹',
    description: '霓虹风格，适合夜生活/酒吧场景',
    colors: {
      primary: '#722ed1', // 紫色
      accent: '#eb2f96', // 粉红
      text: '#f0f0f0', // 浅灰白文字
      background: '#160d2e', // 深紫黑背景
    },
    swatches: ['#722ed1', '#eb2f96', '#f0f0f0', '#160d2e'],
  },
  {
    id: 'luxury_gold',
    name: '轻奢金棕',
    description: '高端金棕色调，适合品质好物推荐',
    colors: {
      primary: '#d4a843', // 哑光金
      accent: '#b07d2b', // 深棕
      text: '#3d2b1f', // 深棕文字
      background: '#fdf6e3', // 米白背景
    },
    swatches: ['#d4a843', '#b07d2b', '#3d2b1f', '#fdf6e3'],
  },
  {
    id: 'ocean_blue',
    name: '清凉海蓝',
    description: '清爽蓝色调，适合夏季好物',
    colors: {
      primary: '#1890ff', // 海洋蓝
      accent: '#69c0ff', // 天蓝
      text: '#0050b3', // 深蓝文字
      background: '#e6f7ff', // 极浅蓝背景
    },
    swatches: ['#1890ff', '#69c0ff', '#0050b3', '#e6f7ff'],
  },
];

/** Build a theme token map from a preset's colors */
export function buildThemeFromPreset(
  preset: ThemePreset,
): Record<string, string> {
  return {
    primary: preset.colors.primary,
    accent: preset.colors.accent,
    text: preset.colors.text,
    background: preset.colors.background,
  };
}

/**
 * Calculate relative luminance of a hex color.
 * Used for WCAG contrast ratio computation.
 */
export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Convert hex to RGB */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Calculate WCAG contrast ratio between two hex colors.
 * Returns value from 1 to 21.
 */
export function getContrastRatio(
  foreground: string,
  background: string,
): number {
  const l1 = getRelativeLuminance(foreground);
  const l2 = getRelativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Get WCAG level label from contrast ratio */
export function getContrastLevel(ratio: number): {
  label: string;
  color: string;
} {
  if (ratio >= 7) return { label: 'AAA', color: '#52c41a' }; // Excellent
  if (ratio >= 4.5) return { label: 'AA', color: '#1890ff' }; // Good
  if (ratio >= 3) return { label: 'AA+', color: '#fa8c16' }; // Large text only
  return { label: '_fail', color: '#ff4d4f' }; // Fails
}

/**
 * Map theme tokens to the fill colors they should replace on elements.
 * Returns the hex colors from the old theme that should be replaced.
 */
export function getThemeTokenColors(
  theme: Record<string, string>,
): Record<string, string> {
  return { ...theme };
}

/**
 * Given an old theme colors and new theme colors, compute a mapping from
 * old hex → new hex for each token key. Used for color find-replace on elements.
 */
export function buildColorReplaceMap(
  oldTheme: Record<string, string>,
  newTheme: Record<string, string>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const key of Object.keys(newTheme)) {
    if (oldTheme[key] && oldTheme[key] !== newTheme[key]) {
      map.set(oldTheme[key], newTheme[key]);
    }
  }
  return map;
}
