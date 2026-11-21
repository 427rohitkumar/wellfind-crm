import { useState, useRef, useEffect, useMemo } from 'react';
import { PersonAvatar } from '@/components/ui/PersonAvatar';
import { NotificationBell } from './NotificationBell';
import { roleLabel as roleLabelOf } from '@/services/roles';
import { GlobalSearch } from './GlobalSearch';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAppShell } from '../../context/AppShellContext';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { isSidebarCollapsed, toggleSidebar } = useAppShell();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);

  const isTeacher = user?.role === 'teacher';

  const displayName = useMemo(() => {
    if (user?.name) return user.name;
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      return emailName;
    }
    return 'Steven Gerrard';
  }, [user]);

  const userEmail = useMemo(() => {
    return user?.email || (displayName === 'Steven Gerrard' ? 'steven@meridian.com' : 'admin@wellfind.academy');
  }, [user, displayName]);

  const roleLabel = useMemo(() => roleLabelOf(user?.role || user?.roles?.[0]) || 'Super Admin', [user]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header className="navbar" role="banner">
      {/* Sidebar toggle button (hamburger) */}
      <button
        type="button"
        className="button button--ghost button--neutral button--icon-only button--flush-start"
        onClick={toggleSidebar}
        aria-expanded={!isSidebarCollapsed}
        aria-label="Toggle sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1em"
          height="1em"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.5"
            d="M20 7H4m16 5H4m16 5H4"
          />
        </svg>
      </button>

      {/* Global search (admin) */}
      {!isTeacher && <GlobalSearch />}

      {/* Right actions */}
      <div className="ms-auto flex items-center">
        <div className="flex gap-1.5 sm:gap-2 items-center">
          <NotificationBell enabled={!isTeacher} />

          <div className="relative menu" ref={userMenuRef}>
            <button
              type="button"
              className="navbar-user-btn"
              data-state={userMenuOpen ? 'open' : 'closed'}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              onClick={() => {
                setUserMenuOpen((prev) => !prev);
              }}
            >
              <span className="hidden sm:inline font-medium text-sm text-foreground">
                {displayName}
              </span>
              <PersonAvatar src={user?.avatar} name={displayName} size={32} />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                aria-hidden="true"
                style={{
                  transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                  color: 'var(--color-muted-foreground)',
                }}
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="m19 9l-7 6l-7-6"
                />
              </svg>
            </button>

            {userMenuOpen && (
              <div
                className="navbar-profile-dropdown"
                data-state="open"
                role="menu"
              >
                {/* User Identity Section: Email and Role only */}
                <div className="navbar-profile-header">
                  <div className="navbar-profile-email" title={userEmail}>
                    {userEmail}
                  </div>
                  {roleLabel && (
                    <div className="navbar-profile-role-wrapper">
                      <span className="navbar-profile-role-badge">
                        {roleLabel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Option */}
                <NavLink
                  to={isTeacher ? '/teacher/profile' : '/admin/profile'}
                  className="navbar-profile-item"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <g fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="6" r="4" />
                      <path d="M20 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S7.582 13 12 13s8 2.015 8 4.5Z" />
                    </g>
                  </svg>
                  <span>Profile</span>
                </NavLink>

                {/* Subtle Divider */}
                <hr className="navbar-profile-divider" />

                {/* Log out Option */}
                <button
                  type="button"
                  className="navbar-profile-item navbar-profile-item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5">
                      <path d="M9.002 7c.012-2.175.109-3.353.877-4.121C10.758 2 12.172 2 15 2h1c2.829 0 4.243 0 5.122.879C22 3.757 22 5.172 22 8v8c0 2.828 0 4.243-.878 5.121C20.242 22 18.829 22 16 22h-1c-2.828 0-4.242 0-5.121-.879c-.768-.768-.865-1.946-.877-4.121" />
                      <path strokeLinejoin="round" d="M15 12H2m0 0l3.5-3M2 12l3.5 3" />
                    </g>
                  </svg>
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
