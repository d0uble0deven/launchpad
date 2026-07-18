import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import styles from './App.module.css';
import ComponentGallery from './dev/ComponentGallery';
import BoardPage from './pages/BoardPage/BoardPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import NewHirePage from './pages/NewHirePage/NewHirePage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import TemplateBuilderPage from './pages/TemplateBuilderPage/TemplateBuilderPage';
import { AppStateProvider } from './state/AppStateContext';
import { PreferencesProvider, usePreferences } from './state/PreferencesContext';
import { ThemeProvider, useTheme } from './state/ThemeContext';

function Brand() {
  const { theme } = useTheme();
  const { preferences } = usePreferences();
  const effective =
    preferences.branding === 'auto'
      ? theme === 'docme360'
        ? 'docme360'
        : 'launchpad'
      : preferences.branding;

  if (effective === 'docme360') {
    return (
      <div className={styles.brand}>
        <span className={styles.dmIcon} aria-hidden="true">
          ‹+›
        </span>
        <span className={styles.wordmark}>
          DocMe<span className={styles.dm360}>360</span>
        </span>
        <span className={styles.brandTag}>LaunchPad</span>
      </div>
    );
  }
  return (
    <div className={styles.brand}>
      <span className={styles.logo} aria-hidden="true">
        🚀
      </span>
      <span className={styles.wordmark}>LaunchPad</span>
    </div>
  );
}

function AppShell() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`;

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <Brand />
        <nav className={styles.nav} aria-label="Main navigation">
          <NavLink to="/" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/new-hire" className={navClass}>
            New Hire
          </NavLink>
          <NavLink to="/template" className={navClass}>
            Template
          </NavLink>
          <NavLink to="/test" className={navClass}>
            Test Page
          </NavLink>
          <NavLink to="/settings" className={navClass}>
            Settings
          </NavLink>
        </nav>
      </header>

      <main className={styles.page}>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/new-hire" element={<NewHirePage />} />
          <Route path="/template" element={<TemplateBuilderPage />} />
          <Route path="/board/:employeeId" element={<BoardPage />} />
          <Route path="/test" element={<ComponentGallery />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <PreferencesProvider>
          <AppStateProvider>
            <AppShell />
          </AppStateProvider>
        </PreferencesProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
