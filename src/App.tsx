import { BrowserRouter, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import styles from './App.module.css';
import ComponentGallery from './dev/ComponentGallery';
import BoardPage from './pages/BoardPage/BoardPage';
import DashboardPage from './pages/DashboardPage/DashboardPage';
import NewHirePage from './pages/NewHirePage/NewHirePage';
import TemplateBuilderPage from './pages/TemplateBuilderPage/TemplateBuilderPage';
import { AppStateProvider } from './state/AppStateContext';

function App() {
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`;

  return (
    <BrowserRouter>
      <AppStateProvider>
        <div className={styles.app}>
          <header className={styles.header}>
            <div className={styles.brand}>
              <span className={styles.logo} aria-hidden="true">
                🚀
              </span>
              <span className={styles.wordmark}>LaunchPad</span>
            </div>
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
            </nav>
          </header>

          <main className={styles.page}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/new-hire" element={<NewHirePage />} />
              <Route path="/template" element={<TemplateBuilderPage />} />
              <Route path="/board/:employeeId" element={<BoardPage />} />
              <Route path="/test" element={<ComponentGallery />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AppStateProvider>
    </BrowserRouter>
  );
}

export default App;
