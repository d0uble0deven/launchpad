import { THEMES, useTheme } from '../../state/ThemeContext';
import styles from './SettingsPage.module.css';

function SettingsPage() {
  const { theme, setTheme } = useTheme();

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
    </div>
  );
}

export default SettingsPage;
