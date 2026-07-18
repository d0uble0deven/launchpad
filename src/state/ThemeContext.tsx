import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

export type ThemeId = 'launchpad' | 'docme360' | 'midnight';

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  description: string;
  /** Swatches shown on the settings page: bg, surface, primary, accent, text. */
  preview: [string, string, string, string, string];
};

/**
 * Theme values live in src/styles/global.css as `[data-theme=…]` overrides;
 * this list only drives the settings UI. Per-person lane colors and
 * status/category pills are data colors and identical in every theme.
 */
export const THEMES: ThemeDefinition[] = [
  {
    id: 'launchpad',
    name: 'LaunchPad',
    description: 'The default look — crisp neutrals with indigo.',
    preview: ['#f4f5f7', '#ffffff', '#4f46e5', '#f59e0b', '#1f2430'],
  },
  {
    id: 'docme360',
    name: 'DocMe360',
    description:
      'Company colors — deep navy, icy blue, and the signature brick-red accent.',
    preview: ['#f2f7fb', '#96c2e9', '#003e73', '#b32d2e', '#151d23'],
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Low-glare dark mode for late-night onboarding sessions.',
    preview: ['#10141c', '#1a202c', '#6366f1', '#f59e0b', '#e8ebf2'],
  },
];

const STORAGE_KEY = 'launchpad-theme';

function loadStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (THEMES.some((theme) => theme.id === stored)) return stored as ThemeId;
  } catch {
    // storage unavailable (private mode etc.) — fall through to default
  }
  return 'launchpad';
}

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(loadStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // fine — the choice just won't survive a reload
    }
    console.log(`[theme] applied "${theme}"`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return value;
}
