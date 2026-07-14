import { useEffect, useMemo, useState } from 'react';
import styles from './App.module.css';
import { buildMockBoard, MOCK_EMPLOYEE } from './data/mockBoard';
import ComponentGallery from './dev/ComponentGallery';
import type { TaskStatus } from './types/board';
import { STATUS_LABELS } from './types/board';

type Tab = 'board' | 'test';

const STATUS_ORDER: TaskStatus[] = [
  'not-started',
  'blocked',
  'ready',
  'in-progress',
  'done',
  'na',
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('board');
  const board = useMemo(() => buildMockBoard(), []);

  useEffect(() => {
    console.log('[data] mock board loaded', board);
    console.log(
      `[data] ${board.tasks.length} tasks across ${board.phases.length} phases and ${board.swimlanes.length} swimlanes`,
    );
  }, [board]);

  const statusCounts = useMemo(() => {
    const counts = {} as Record<TaskStatus, number>;
    for (const status of STATUS_ORDER) counts[status] = 0;
    for (const task of board.tasks) counts[task.status] += 1;
    return counts;
  }, [board]);

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
        {activeTab === 'test' ? (
          <ComponentGallery />
        ) : (
          <div className={styles.placeholder}>
            <h1 className={styles.placeholderTitle}>Mural Board Page</h1>
            <p className={styles.placeholderText}>
              The interactive onboarding board goes here (Step 1.5).
            </p>
            <div className={styles.boardSummary}>
              <p className={styles.summaryLine}>
                <strong>{MOCK_EMPLOYEE.name}</strong> — {MOCK_EMPLOYEE.role} ·{' '}
                {MOCK_EMPLOYEE.location} · Step {MOCK_EMPLOYEE.currentStep}
              </p>
              <p className={styles.summaryLine}>
                {board.tasks.length} tasks · {board.phases.length} phases ·{' '}
                {board.swimlanes.length} swimlanes
              </p>
              <p className={styles.summaryLine}>
                {STATUS_ORDER.map(
                  (status) =>
                    `${STATUS_LABELS[status]}: ${statusCounts[status]}`,
                ).join(' · ')}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
