import styles from './App.module.css';

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
        <div className={styles.placeholder}>
          <h1 className={styles.placeholderTitle}>Mural Board Page</h1>
          <p className={styles.placeholderText}>
            The interactive onboarding board goes here (Step 1.5).
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
