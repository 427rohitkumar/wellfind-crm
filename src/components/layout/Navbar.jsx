import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAppShell } from '../../context/AppShellContext';
import { useAuth } from '@/hooks/useAuth';

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { isSidebarCollapsed, toggleSidebar } = useAppShell();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const messagesRef = useRef(null);
  const notifRef = useRef(null);
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

  const roleLabel = useMemo(() => {
    const rawRole = user?.role || user?.roles?.[0];
    if (!rawRole) return 'Super Admin';
    if (rawRole === 'super_admin' || rawRole === 'superadmin') return 'Super Admin';
    if (rawRole === 'teacher') return 'Teacher';
    if (rawRole === 'admin') return 'Admin';
    return String(rawRole)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }, [user]);

  const initials = useMemo(() => {
    return displayName
      .split(/[\s._-]+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'SG';
  }, [displayName]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (messagesRef.current && !messagesRef.current.contains(event.target)) {
        setMessagesOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMessagesOpen(false);
        setNotifOpen(false);
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

  const handleSearch = (e) => {
    e.preventDefault();
  };

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

      {/* Global search */}
      <form
        className="input-group input-group--search hidden lg:flex"
        onSubmit={handleSearch}
        role="search"
      >
        <span className="input-group__text" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <g fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11.5" cy="11.5" r="9.5" />
              <path strokeLinecap="round" d="M18.5 18.5L22 22" />
            </g>
          </svg>
        </span>
        <input
          type="search"
          className="input"
          placeholder="Search inquiries, students, teachers…"
          aria-label="Search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </form>

      {/* Right actions */}
      <div className="ms-auto flex items-center">
        <div className="flex gap-1.5 sm:gap-2 items-center">
          {/* Messages Popover */}
          <div className="relative" ref={messagesRef}>
            <button
              type="button"
              className="button button--ghost button--neutral button--icon-only"
              onClick={() => {
                setMessagesOpen((prev) => !prev);
                setNotifOpen(false);
                setUserMenuOpen(false);
              }}
              aria-label="Messages"
              aria-expanded={messagesOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1.25em"
                height="1.25em"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <g fill="none" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.009m3.982 0H12m3.991 0H16"
                  />
                  <path
                    strokeWidth="1.5"
                    d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12c0 1.6.376 3.112 1.043 4.453c.178.356.237.763.134 1.148l-.595 2.226a1.3 1.3 0 0 0 1.591 1.592l2.226-.596a1.63 1.63 0 0 1 1.149.133A9.96 9.96 0 0 0 12 22Z"
                  />
                </g>
              </svg>
            </button>
            <span className="indicator indicator--warning indicator--pulse absolute top-0 inset-e-0 translate-x-1/2 -translate-y-1/2"></span>

            {messagesOpen && (
              <div
                className="popover popover--menu w-88 max-w-full shadow-xl"
                data-state="open"
                role="dialog"
                aria-label="Messages"
              >
                <div className="popover__header">
                  <h3 className="popover__title">Message</h3>
                  <div className="popover__action">
                    <button
                      type="button"
                      className="button button--sm button--ghost button--primary button--flush-end"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
                <div className="popover__body">
                  <a href="#" className="media media--unread items-start">
                    <div className="media__figure mt-1">
                      <span className="avatar avatar--sm avatar--circle">
                        <img
                          className="avatar__image"
                          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2.5&w=80&h=80&q=80"
                          alt="JC"
                        />
                        <span className="avatar__fallback">JC</span>
                      </span>
                    </div>
                    <div className="media__content">
                      <div className="media__title">Joseph Cooper</div>
                      <div className="media__description">Pushed 3 commits to atlas/main.</div>
                      <div className="media__meta">2 minutes ago</div>
                    </div>
                  </a>
                  <a href="#" className="media items-start">
                    <div className="media__figure mt-1">
                      <span className="avatar avatar--sm avatar--circle">
                        <img
                          className="avatar__image"
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2.5&w=80&h=80&q=80"
                          alt="SC"
                        />
                        <span className="avatar__fallback">SC</span>
                      </span>
                    </div>
                    <div className="media__content">
                      <div className="media__title">Sarah Chen</div>
                      <div className="media__description">Can you review the Q3 report draft?</div>
                      <div className="media__meta">1 hour ago</div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Popover (Bell) */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              className="button button--ghost button--neutral button--icon-only"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setMessagesOpen(false);
                setUserMenuOpen(false);
              }}
              aria-label="Notifications"
              aria-expanded={notifOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1.25em"
                height="1.25em"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18.75 9.71v-.705C18.75 5.136 15.726 2 12 2S5.25 5.136 5.25 9.005v.705a4.4 4.4 0 0 1-.692 2.375L3.45 13.81c-1.011 1.575-.239 3.716 1.52 4.214a25.8 25.8 0 0 0 14.06 0c1.759-.498 2.531-2.639 1.52-4.213l-1.108-1.725a4.4 4.4 0 0 1-.692-2.376Z" />
                  <path strokeLinecap="round" d="M9.5 19.5a2.5 2.5 0 0 0 5 0" />
                </g>
              </svg>
            </button>

            {notifOpen && (
              <div
                className="popover popover--menu w-80 max-w-full shadow-xl"
                data-state="open"
                role="dialog"
                aria-label="Notifications"
              >
                <div className="popover__header">
                  <h3 className="popover__title">Notifications</h3>
                  <div className="popover__action">
                    <button
                      type="button"
                      className="button button--sm button--ghost button--primary button--flush-end"
                    >
                      Mark all as read
                    </button>
                  </div>
                </div>
                <div className="popover__body">
                  <a href="#" className="media items-start">
                    <div className="media__figure mt-1">
                      <span className="icon-box icon-box--primary">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <g fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
                          </g>
                        </svg>
                      </span>
                    </div>
                    <div className="media__content">
                      <div className="media__title">New payment received</div>
                      <div className="media__description">Teacher registration fee ₹1,000 paid.</div>
                      <div className="media__meta">10 minutes ago</div>
                    </div>
                  </a>
                  <a href="#" className="media items-start">
                    <div className="media__figure mt-1">
                      <span className="icon-box icon-box--success">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="1em"
                          height="1em"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <g fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="9" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="m9 12l2 2l4-4" />
                          </g>
                        </svg>
                      </span>
                    </div>
                    <div className="media__content">
                      <div className="media__title">New enquiry submitted</div>
                      <div className="media__description">Class 10 Mathematics inquiry from Gurgaon.</div>
                      <div className="media__meta">1 hour ago</div>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            className="button button--ghost button--neutral button--icon-only"
            onClick={toggleTheme}
            data-theme-toggle
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1.25em"
                height="1.25em"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <g fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="4" />
                  <path strokeLinecap="round" d="M12 2v2m0 16v2m-10-10h2m16 0h2m-3.05-6.95l-1.414 1.414M6.464 17.536l-1.414 1.414m12.728 0l-1.414-1.414M6.464 6.464L5.05 5.05" />
                </g>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1.25em"
                height="1.25em"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="m21.067 11.857l-.642-.388zm-8.924-8.924l-.388-.642zM21.25 12A9.25 9.25 0 0 1 12 21.25v1.5c5.937 0 10.75-4.813 10.75-10.75zM12 21.25A9.25 9.25 0 0 1 2.75 12h-1.5c0 5.937 4.813 10.75 10.75 10.75zM2.75 12A9.25 9.25 0 0 1 12 2.75v-1.5C6.063 1.25 1.25 6.063 1.25 12zm12.75 2.25A5.75 5.75 0 0 1 9.75 8.5h-1.5a7.25 7.25 0 0 0 7.25 7.25zm4.925-2.781A5.75 5.75 0 0 1 15.5 14.25v1.5a7.25 7.25 0 0 0 6.21-3.505zM9.75 8.5a5.75 5.75 0 0 1 2.781-4.925l-.776-1.284A7.25 7.25 0 0 0 8.25 8.5zM12 2.75a.38.38 0 0 1-.268-.118a.3.3 0 0 1-.082-.155c-.004-.031-.002-.121.105-.186l.776 1.284c.503-.304.665-.861.606-1.299c-.062-.455-.42-1.026-1.137-1.026zm9.71 9.495c-.066.107-.156.109-.187.105a.3.3 0 0 1-.155-.082a.38.38 0 0 1-.118-.268h1.5c0-.717-.571-1.075-1.026-1.137c-.438-.059-.995.103-1.299.606z"
                />
              </svg>
            )}
          </button>

          {/* User profile menu */}
          <div className="relative menu" ref={userMenuRef}>
            <button
              type="button"
              className="navbar-user-btn"
              data-state={userMenuOpen ? 'open' : 'closed'}
              aria-haspopup="menu"
              aria-expanded={userMenuOpen}
              onClick={() => {
                setUserMenuOpen((prev) => !prev);
                setMessagesOpen(false);
                setNotifOpen(false);
              }}
            >
              <span className="hidden sm:inline font-medium text-sm text-foreground">
                {displayName}
              </span>
              <span className="avatar avatar--sm avatar--circle">
                <img
                  className="avatar__image"
                  src={user?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2.5&w=80&h=80&q=80"}
                  alt={displayName}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <span className="avatar__fallback font-semibold">{initials}</span>
              </span>
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
                  to={isTeacher ? '/teacher/profile' : '/profile'}
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

                {/* Settings Option */}
                <NavLink
                  to={isTeacher ? '/teacher/settings' : '/settings'}
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
                      <circle cx="12" cy="12" r="3" />
                      <path d="M13.765 2.152C13.398 2 12.932 2 12 2s-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083c-.092.223-.129.484-.143.863a1.62 1.62 0 0 1-.79 1.353a1.62 1.62 0 0 1-1.567.008c-.336-.178-.579-.276-.82-.308a2 2 0 0 0-1.478.396C4.04 5.79 3.806 6.193 3.34 7s-.7 1.21-.751 1.605a2 2 0 0 0 .396 1.479c.148.192.355.353.676.555c.473.297.777.803.777 1.361s-.304 1.064-.777 1.36c-.321.203-.529.364-.676.556a2 2 0 0 0-.396 1.479c.052.394.285.798.75 1.605c.467.807.7 1.21 1.015 1.453a2 2 0 0 0 1.479.396c.24-.032.483-.13.819-.308a1.62 1.62 0 0 1 1.567.008c.483.28.77.795.79 1.353c.014.38.05.64.143.863a2 2 0 0 0 1.083 1.083C10.602 22 11.068 22 12 22s1.398 0 1.765-.152a2 2 0 0 0 1.083-1.083c.092-.223.129-.483.143-.863c.02-.558.307-1.074.79-1.353a1.62 1.62 0 0 1 1.567-.008c.336.178.579.276.819.308a2 2 0 0 0 1.479-.396c.315-.242.548-.646 1.014-1.453s.7-1.21.751-1.605a2 2 0 0 0-.396-1.479c-.148-.192-.355-.353-.676-.555A1.62 1.62 0 0 1 19.562 12c0-.558.304-1.064.777-1.36c.321-.203.529-.364.676-.556a2 2 0 0 0 .396-1.479c-.052-.394-.285-.798-.75-1.605c-.467-.807-.7-1.21-1.015-1.453a2 2 0 0 0-1.479-.396c-.24.032-.483.13-.82.308a1.62 1.62 0 0 1-1.566-.008a1.62 1.62 0 0 1-.79-1.353c-.014-.38-.05-.64-.143-.863a2 2 0 0 0 1.083-1.083Z" />
                    </g>
                  </svg>
                  <span>Settings</span>
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
