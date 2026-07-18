import { useState } from 'react';
import Button from '../../components/atoms/Button/Button';
import { CARD_PALETTES } from '../../logic/cardPalettes';
import { useAppState } from '../../state/AppStateContext';
import { usePreferences } from '../../state/PreferencesContext';
import type {
  BoardOpenMode,
  BrandingMode,
} from '../../state/PreferencesContext';
import { THEMES, useTheme } from '../../state/ThemeContext';
import styles from './SettingsPage.module.css';

const BRANDING_OPTIONS: Array<{
  value: BrandingMode;
  label: string;
  hint: string;
}> = [
  {
    value: 'auto',
    label: 'Match theme',
    hint: 'DocMe360 wordmark with the DocMe360 theme, rocket otherwise',
  },
  { value: 'launchpad', label: 'LaunchPad', hint: 'Always the 🚀 wordmark' },
  {
    value: 'docme360',
    label: 'DocMe360',
    hint: 'Always the company wordmark',
  },
];

const BOARD_OPEN_OPTIONS: Array<{
  value: BoardOpenMode;
  label: string;
  hint: string;
}> = [
  {
    value: 'smart',
    label: 'Smart focus',
    hint: 'Zoom to the blocker or current step',
  },
  {
    value: 'fit',
    label: 'Whole board',
    hint: 'Fit the full map, zoomed out',
  },
];

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { preferences, setPreference } = usePreferences();
  const { resetAll } = useAppState();
  const [resetArmed, setResetArmed] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (!resetArmed) {
      setResetArmed(true);
      return;
    }
    setResetting(true);
    try {
      await resetAll();
    } finally {
      setResetting(false);
      setResetArmed(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          Preferences apply instantly and are saved in this browser.
        </p>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Theme</h2>
        <p className={styles.sectionHint}>
          Pick how LaunchPad looks. Board colors stay per-person in every
          theme.
        </p>
        <div
          className={styles.themeGrid}
          role="radiogroup"
          aria-label="Color theme"
        >
          {THEMES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={theme === option.id}
              className={[
                styles.themeCard,
                theme === option.id ? styles.themeCardActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                console.log(`[settings] theme → ${option.id}`);
                setTheme(option.id);
              }}
            >
              <span className={styles.swatches} aria-hidden="true">
                {option.preview.map((color) => (
                  <i
                    key={color}
                    className={styles.swatch}
                    style={{ background: color }}
                  />
                ))}
              </span>
              <span className={styles.themeName}>
                {option.name}
                {theme === option.id && (
                  <span className={styles.activeBadge}>Active</span>
                )}
              </span>
              <span className={styles.themeDescription}>
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Card colors</h2>
        <p className={styles.sectionHint}>
          The per-person palette used for board cards, lane chips, and the
          map. Every palette keeps colors distinct — boards with more people
          than shown here get additional non-overlapping colors
          automatically.
        </p>
        <div
          className={styles.themeGrid}
          role="radiogroup"
          aria-label="Card color palette"
        >
          {CARD_PALETTES.map((palette) => (
            <button
              key={palette.id}
              type="button"
              role="radio"
              aria-checked={preferences.cardPalette === palette.id}
              className={[
                styles.themeCard,
                preferences.cardPalette === palette.id
                  ? styles.themeCardActive
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => setPreference('cardPalette', palette.id)}
            >
              <span className={styles.paletteStrip} aria-hidden="true">
                {palette.curated.slice(0, 8).map((color) => (
                  <i
                    key={color}
                    className={styles.paletteChip}
                    style={{ background: color }}
                  />
                ))}
              </span>
              <span className={styles.themeName}>
                {palette.name}
                {preferences.cardPalette === palette.id && (
                  <span className={styles.activeBadge}>Active</span>
                )}
              </span>
              <span className={styles.themeDescription}>
                {palette.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Header branding</h2>
        <p className={styles.sectionHint}>
          Which wordmark shows in the top-left corner.
        </p>
        <div
          className={styles.optionRow}
          role="radiogroup"
          aria-label="Header branding"
        >
          {BRANDING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={preferences.branding === option.value}
              className={[
                styles.optionPill,
                preferences.branding === option.value
                  ? styles.optionPillActive
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={option.hint}
              onClick={() => setPreference('branding', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Board opens to</h2>
        <p className={styles.sectionHint}>
          Where the viewport lands when you open someone's board. Slack task
          links always jump straight to their task.
        </p>
        <div
          className={styles.optionRow}
          role="radiogroup"
          aria-label="Board opening view"
        >
          {BOARD_OPEN_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={preferences.boardOpen === option.value}
              className={[
                styles.optionPill,
                preferences.boardOpen === option.value
                  ? styles.optionPillActive
                  : '',
              ]
                .filter(Boolean)
                .join(' ')}
              title={option.hint}
              onClick={() => setPreference('boardOpen', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Motion</h2>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            className={styles.toggleInput}
            checked={preferences.reduceMotion}
            onChange={(event) =>
              setPreference('reduceMotion', event.target.checked)
            }
          />
          <span>
            <span className={styles.toggleLabel}>Reduce animations</span>
            <span className={styles.toggleHint}>
              Turns off glow pulses and viewport flights. Your OS
              reduced-motion setting is always respected too.
            </span>
          </span>
        </label>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Data</h2>
        <p className={styles.sectionHint}>
          Restore the sample template, hires, and boards. This erases current
          board edits for everyone using this server.
        </p>
        <div>
          <Button
            variant="danger"
            onClick={handleReset}
            onBlur={() => setResetArmed(false)}
            disabled={resetting}
          >
            {resetting
              ? 'Resetting…'
              : resetArmed
                ? 'Confirm reset?'
                : 'Reset to sample data'}
          </Button>
        </div>
      </section>
    </div>
  );
}

export default SettingsPage;
