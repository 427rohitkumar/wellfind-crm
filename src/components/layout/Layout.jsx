import { Outlet, Link } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { useAppShell } from '../../context/AppShellContext';
import { useTheme } from '../../context/ThemeContext';
import { EnquiryCountProvider } from '../../context/EnquiryCountContext';
import { useTableDragScroll } from '../../hooks/useTableDragScroll';
import { Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';

export function Layout() {
  const { isSidebarCollapsed, isSidebarVisible, isMobile, setSidebarVisible } = useAppShell();
  useTableDragScroll();

  return (
    <EnquiryCountProvider>
      <div
        id="app-shell"
        className={clsx(
          'app-shell',
          { 'is-sidebar-collapsed': isSidebarCollapsed && !isMobile },
          { 'is-sidebar-visible': isSidebarVisible && isMobile }
        )}
        data-stisla-app-shell
        onClick={(e) => {
          if (isMobile && isSidebarVisible && !e.target.closest('.sidebar') && !e.target.closest('.navbar button')) {
            setSidebarVisible(false);
          }
        }}
      >
        <Sidebar />
        <main className="app-shell__main">
          <Navbar />
          <div className="page content">
            <div className="content__container">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </EnquiryCountProvider>
  );
}

export function AuthLayout({ children }) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="auth" data-theme={theme}>
      <button
        type="button"
        className="auth__toggle button button--ghost button--icon button--sm"
        onClick={toggleTheme}
        data-theme-toggle
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? (
          <Sun className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Moon className="w-5 h-5" aria-hidden="true" />
        )}
      </button>
      <main className="auth__panel">
        {children || <Outlet />}
      </main>
      <aside className="auth__aside" aria-hidden="true">
        <a href="/" className="auth__brand" aria-label="Wellfind Academic">
          <span
            className="auth__brand-mark"
            style={{
              width: '44px',
              height: '44px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
              flexShrink: 0,
            }}
          >
            <img
              src="/blue-logo-wellfind.png"
              alt="Wellfind Academic"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </span>
          <span className="auth__brand-text">
            <span className="auth__brand-name">Wellfind Academic</span>
          </span>
        </a>
        <div className="auth__pitch">
          <h1 className="auth__pitch-title">Managed <span>Education Network</span></h1>
          <p className="auth__pitch-lede">Student enquiries, teacher applications, and tutor mapping — all managed from one calm dashboard.</p>
        </div>
      </aside>
    </div>
  );
}

export function ErrorLayout({ children }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="error-page" data-theme={theme}>
      <header className="error-page__header">
        <Link to="/" className="error-page__brand" aria-label="Wellfind Academic">
          <span className="error-page__brand-mark">
            <img
              src="/blue-logo-wellfind.png"
              alt="Wellfind Academic"
              className="error-page__brand-logo"
            />
          </span>
          <span className="error-page__brand-name">Wellfind Academic</span>
        </Link>
        <button
          type="button"
          className="error-page__toggle button button--ghost button--icon button--sm"
          onClick={toggleTheme}
          data-theme-toggle
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Moon className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      </header>
      <main className="error-page__content">
        {children || <Outlet />}
      </main>
    </div>
  );
}
