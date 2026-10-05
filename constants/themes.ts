export type Palette = {
  primary: string;
  accent: string;
  background: string;
  card: string;
  elevated: string;
  surface: string;
  border: string;
  shadow: string;
  shadowOpacity: number;
  textPrimary: string;
  textSecondary: string;
  muted: string;
  textOnPrimary: string;
  tint: string;
  logo: string;
  success: string;
  danger: string;
};

export type ThemeMode = 'light' | 'dark';

export type ThemeId = 'grape' | 'circuit' | 'neon' | 'terminal' | 'midnight';

export type ThemeMeta = {
  id: ThemeId;
  name: string;
  tagline: string;
  mode: ThemeMode;
  colors: Palette;
};

export const THEMES: ThemeMeta[] = [
  {
    id: 'grape',
    name: 'Grape',
    tagline: 'Original soft look',
    mode: 'light',
    colors: {
      primary: '#c29ccf',
      accent: '#8B6FBF',
      background: '#F5F9FF',
      card: '#FFFFFF',
      elevated: '#FFFFFF',
      surface: '#E3F2FD',
      border: '#E0E8F0',
      shadow: '#0D47A1',
      shadowOpacity: 0.1,
      textPrimary: '#0D1B2A',
      textSecondary: '#171520',
      muted: '#5B6675',
      textOnPrimary: '#FFFFFF',
      tint: '#c29ccf1F',
      logo: '#4e6061',
      success: '#2E7D32',
      danger: '#C62828',
    },
  },
  {
    id: 'circuit',
    name: 'Circuit',
    tagline: 'Clean IT blue',
    mode: 'light',
    colors: {
      primary: '#0284C7',
      accent: '#06B6D4',
      background: '#F2F8FD',
      card: '#FFFFFF',
      elevated: '#FFFFFF',
      surface: '#E0F2FE',
      border: '#D5E6F4',
      shadow: '#0C4A6E',
      shadowOpacity: 0.12,
      textPrimary: '#0A1F33',
      textSecondary: '#2B4257',
      muted: '#5A738A',
      textOnPrimary: '#FFFFFF',
      tint: '#0284C71F',
      logo: '#0E7490',
      success: '#15803D',
      danger: '#DC2626',
    },
  },
  {
    id: 'neon',
    name: 'Neon',
    tagline: 'Cyber night glow',
    mode: 'dark',
    colors: {
      primary: '#22D3EE',
      accent: '#F472B6',
      background: '#070D18',
      card: '#0E1729',
      elevated: '#14203A',
      surface: '#16233D',
      border: '#22314E',
      shadow: '#000000',
      shadowOpacity: 0.5,
      textPrimary: '#E8F1FF',
      textSecondary: '#A9BCD6',
      muted: '#7187A6',
      textOnPrimary: '#05121B',
      tint: '#22D3EE2E',
      logo: '#67E8F9',
      success: '#34D399',
      danger: '#F87171',
    },
  },
  {
    id: 'terminal',
    name: 'Terminal',
    tagline: 'Green screen mode',
    mode: 'dark',
    colors: {
      primary: '#22C55E',
      accent: '#A3E635',
      background: '#050C07',
      card: '#0B1510',
      elevated: '#102016',
      surface: '#10241A',
      border: '#1C3826',
      shadow: '#000000',
      shadowOpacity: 0.5,
      textPrimary: '#DDF7E4',
      textSecondary: '#9FC2AB',
      muted: '#6F9079',
      textOnPrimary: '#04140A',
      tint: '#22C55E33',
      logo: '#4ADE80',
      success: '#4ADE80',
      danger: '#F87171',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    tagline: 'Deep slate pro',
    mode: 'dark',
    colors: {
      primary: '#6366F1',
      accent: '#22D3EE',
      background: '#090F1E',
      card: '#111A2F',
      elevated: '#182342',
      surface: '#1A2440',
      border: '#25314F',
      shadow: '#000000',
      shadowOpacity: 0.5,
      textPrimary: '#E9EDFA',
      textSecondary: '#A6B1CB',
      muted: '#7A87A6',
      textOnPrimary: '#FFFFFF',
      tint: '#6366F133',
      logo: '#818CF8',
      success: '#34D399',
      danger: '#FB7185',
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'grape';

export function getTheme(id: string): ThemeMeta {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

export function isThemeId(id: unknown): id is ThemeId {
  return typeof id === 'string' && THEMES.some((theme) => theme.id === id);
}

export type AccentId = string;

export type AccentMeta = {
  id: AccentId;
  name: string;
  color: string | null;
};

export const ACCENTS: AccentMeta[] = [
  { id: 'auto', name: 'Auto', color: null },
  { id: 'indigo', name: 'Indigo', color: '#6366F1' },
  { id: 'violet', name: 'Violet', color: '#8B5CF6' },
  { id: 'sky', name: 'Sky', color: '#0EA5E9' },
  { id: 'cyan', name: 'Cyan', color: '#06B6D4' },
  { id: 'emerald', name: 'Emerald', color: '#10B981' },
  { id: 'lime', name: 'Lime', color: '#84CC16' },
  { id: 'amber', name: 'Amber', color: '#F59E0B' },
  { id: 'rose', name: 'Rose', color: '#F43F5E' },
];

export const DEFAULT_ACCENT_ID: AccentId = 'auto';

export type ShapeId = 'soft' | 'round' | 'pill';

export type Radius = {
  button: number;
  input: number;
  card: number;
  chip: number;
};

export type ShapeMeta = {
  id: ShapeId;
  name: string;
  radius: Radius;
};

export const SHAPES: ShapeMeta[] = [
  {
    id: 'soft',
    name: 'Soft',
    radius: { button: 14, input: 14, card: 16, chip: 999 },
  },
  {
    id: 'round',
    name: 'Rounded',
    radius: { button: 22, input: 16, card: 22, chip: 999 },
  },
  {
    id: 'pill',
    name: 'Pill',
    radius: { button: 999, input: 999, card: 26, chip: 999 },
  },
];

export const DEFAULT_SHAPE_ID: ShapeId = 'soft';

export function getShape(id: string): ShapeMeta {
  return SHAPES.find((shape) => shape.id === id) ?? SHAPES[0];
}

export function isShapeId(id: unknown): id is ShapeId {
  return typeof id === 'string' && SHAPES.some((shape) => shape.id === id);
}

function channelLuminance(value: number) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function luminanceOf(hex: string): number {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return 0;
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function readableOn(hex: string): string {
  return luminanceOf(hex) > 0.3 ? '#0B1020' : '#FFFFFF';
}

export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((ch) => ch + ch)
          .join('')
      : clean.slice(0, 6);
  const value = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  return `#${full}${value.toString(16).padStart(2, '0').toUpperCase()}`;
}

/**
 * Applies the user's accent choice on top of a theme palette. Keeps every
 * derived value (readable label colour, chip wash) consistent with the accent.
 */
export function resolveColors(theme: ThemeMeta, accentId: string): Palette {
  const accent = ACCENTS.find((item) => item.id === accentId);
  if (!accent?.color) return theme.colors;

  const primary = accent.color;
  const dark = theme.mode === 'dark';

  return {
    ...theme.colors,
    primary,
    textOnPrimary: readableOn(primary),
    tint: withAlpha(primary, dark ? 0.24 : 0.12),
  };
}
