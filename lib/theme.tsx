import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  ACCENTS,
  DEFAULT_ACCENT_ID,
  DEFAULT_SHAPE_ID,
  DEFAULT_THEME_ID,
  SHAPES,
  getShape,
  getTheme,
  isShapeId,
  isThemeId,
  resolveColors,
  type AccentId,
  type Palette,
  type Radius,
  type ShapeId,
  type ThemeId,
  type ThemeMeta,
  type ThemeMode,
} from '@/constants/themes';

const STORAGE_KEY = 'qratt_appearance_v1';

type StoredPrefs = {
  themeId: ThemeId;
  accentId: AccentId;
  shapeId: ShapeId;
};

const DEFAULT_PREFS: StoredPrefs = {
  themeId: DEFAULT_THEME_ID,
  accentId: DEFAULT_ACCENT_ID,
  shapeId: DEFAULT_SHAPE_ID,
};

export type ThemeContextValue = {
  ready: boolean;
  theme: ThemeMeta;
  themeId: ThemeId;
  mode: ThemeMode;
  colors: Palette;
  radius: Radius;
  accentId: AccentId;
  shapeId: ShapeId;
  accentList: typeof ACCENTS;
  setThemeId: (id: ThemeId) => void;
  setAccentId: (id: AccentId) => void;
  setShapeId: (id: ShapeId) => void;
  resetAppearance: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function parseStored(raw: string | null): StoredPrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPrefs>;
    return {
      themeId: isThemeId(parsed?.themeId) ? parsed.themeId : DEFAULT_PREFS.themeId,
      accentId:
        typeof parsed?.accentId === 'string' &&
        ACCENTS.some((item) => item.id === parsed.accentId)
          ? parsed.accentId
          : DEFAULT_PREFS.accentId,
      shapeId: isShapeId(parsed?.shapeId) ? parsed.shapeId : DEFAULT_PREFS.shapeId,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<StoredPrefs>(DEFAULT_PREFS);
  const [ready, setReady] = useState(false);
  const prefsRef = useRef<StoredPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled) {
          const next = parseStored(raw);
          prefsRef.current = next;
          setPrefs(next);
        }
      } catch {
        // Preferences are cosmetic — fall back to the defaults.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const apply = useCallback((patch: Partial<StoredPrefs>) => {
    const next: StoredPrefs = { ...prefsRef.current, ...patch };
    prefsRef.current = next;
    setPrefs(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setThemeId = useCallback(
    (id: ThemeId) => {
      if (isThemeId(id)) apply({ themeId: id });
    },
    [apply]
  );

  const setAccentId = useCallback(
    (id: AccentId) => apply({ accentId: id }),
    [apply]
  );

  const setShapeId = useCallback(
    (id: ShapeId) => {
      if (isShapeId(id)) apply({ shapeId: id });
    },
    [apply]
  );

  const resetAppearance = useCallback(() => {
    prefsRef.current = DEFAULT_PREFS;
    setPrefs(DEFAULT_PREFS);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFS)).catch(
      () => {}
    );
  }, []);

  const value = useMemo<ThemeContextValue>(() => {
    const theme = getTheme(prefs.themeId);
    return {
      ready,
      theme,
      themeId: theme.id,
      mode: theme.mode,
      colors: resolveColors(theme, prefs.accentId),
      radius: getShape(prefs.shapeId).radius,
      accentId: prefs.accentId,
      shapeId: prefs.shapeId,
      accentList: ACCENTS,
      setThemeId,
      setAccentId,
      setShapeId,
      resetAppearance,
    };
  }, [ready, prefs, setThemeId, setAccentId, setShapeId, resetAppearance]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside a ThemeProvider');
  }
  return ctx;
}

export { SHAPES };
