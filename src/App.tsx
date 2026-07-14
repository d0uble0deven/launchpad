import styles from './App.module.css';
import ComponentGallery from './dev/ComponentGallery';

function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.logo} aria-hidden="true">
            🚀
          </span>
          <span className={styles.wordmark}>LaunchPad</span>
        </div>
        <nav className={styles.nav} aria-label="Main navigation">
          <span className={`${styles.navItem} ${styles.navItemActive}`}>
            Board
          </span>
          <span className={styles.navItem}>Dashboard</span>
          <span className={styles.navItem}>New Hire</span>
        </nav>
      </header>

      <main className={styles.page}>
        {/* Temporary gallery for Step 1.3; the board page replaces it in Step 1.5. */}
        <ComponentGallery />
      </main>
    </div>
  );
}

export default App;
