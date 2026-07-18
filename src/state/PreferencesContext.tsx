import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CardPaletteId } from '../logic/cardPalettes';

/** Which wordmark the header shows. 'auto' follows the active theme. */
export type BrandingMode = 'auto' | 'launchpad' | 'docme360';

/** How a board positions itself on open (deep links always win). */
export type BoardOpenMode = 'smart' | 'fit';

export type Preferences = {
  branding: BrandingMode;
  boardOpen: BoardOpenMode;
  cardPalette: CardPaletteId;
  reduceMotion: boolean;
};

const DEFAULTS: Preferences = {
  branding: 'auto',
  boardOpen: 'smart',
  cardPalette: 'classic',
  reduceMotion: false,
};

const STORAGE_KEY = 'launchpad-preferences';

function loadStored(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      branding: ['auto', 'launchpad', 'docme360'].includes(
        parsed.branding as string,
      )
        ? (parsed.branding as BrandingMode)
        : DEFAULTS.branding,
      boardOpen: ['smart', 'fit'].includes(parsed.boardOpen as string)
        ? (parsed.boardOpen as BoardOpenMode)
        : DEFAULTS.boardOpen,
      cardPalette: ['classic', 'docme360', 'pastel'].includes(
        parsed.cardPalette as string,
      )
        ? (parsed.cardPalette as CardPaletteId)
        : DEFAULTS.cardPalette,
      reduceMotion:
        typeof parsed.reduceMotion === 'boolean'
          ? parsed.reduceMotion
          : DEFAULTS.reduceMotion,
    };
  } catch {
    return DEFAULTS;
  }
}

type PreferencesContextValue = {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(loadStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // storage unavailable — preferences just won't survive a reload
    }
    // Motion preference is honored in CSS via this attribute (JS animations
    // read the flag from context directly).
    document.documentElement.dataset.motion = preferences.reduceMotion
      ? 'reduce'
      : 'full';
  }, [preferences]);

  const value = useMemo(
    () => ({
      preferences,
      setPreference: <K extends keyof Preferences>(
        key: K,
        value: Preferences[K],
      ) => {
        console.log(`[settings] ${key} → ${String(value)}`);
        setPreferences((prev) => ({ ...prev, [key]: value }));
      },
    }),
    [preferences],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesContextValue {
  const value = useContext(PreferencesContext);
  if (!value) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return value;
}
