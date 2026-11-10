import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';

import { useApp } from '@/state/AppState';
import { afterDarkTheme, paperTheme, type ThemeColors } from './tokens';

type Theme = {
  c: ThemeColors;
  dark: boolean;
  scale: number; // in-app text size multiplier (stacks with iOS Dynamic Type)
  reduceMotion: boolean;
};

const ThemeCtx = createContext<Theme>({ c: paperTheme, dark: false, scale: 1, reduceMotion: false });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { prefs } = useApp();
  const system = useColorScheme();
  const [osReduceMotion, setOsReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setOsReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOsReduceMotion);
    return () => sub.remove();
  }, []);

  const value = useMemo<Theme>(() => {
    const dark = prefs.theme === 'afterDark' || (prefs.theme === 'system' && system === 'dark');
    return {
      c: dark ? afterDarkTheme : paperTheme,
      dark,
      scale: prefs.textScale,
      reduceMotion: prefs.reduceMotion || osReduceMotion,
    };
  }, [prefs.theme, prefs.textScale, prefs.reduceMotion, system, osReduceMotion]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeCtx);
}
