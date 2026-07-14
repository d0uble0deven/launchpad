import { useState } from 'react';
import styles from './App.module.css';
import ComponentGallery from './dev/ComponentGallery';
import BoardPage from './pages/BoardPage/BoardPage';

type Tab = 'board' | 'test';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('board');

  const navButton = (tab: Tab, label: string) => (
    <button
      type="button"
      className={`${styles.navItem} ${activeTab === tab ? styles.navItemActive : ''}`}
      onClick={() => setActiveTab(tab)}
    >
      {label}
    </button>
  );

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
          {navButton('board', 'Board')}
          <span className={styles.navItem}>Dashboard</span>
          <span className={styles.navItem}>New Hire</span>
          {navButton('test', 'Test Page')}
        </nav>
      </header>

      <main className={styles.page}>
        {activeTab === 'test' ? <ComponentGallery /> : <BoardPage />}
      </main>
    </div>
  );
}

export default App;
