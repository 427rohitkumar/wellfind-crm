import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppShell } from '../../context/AppShellContext';
import { useEnquiryCounts } from '../../context/EnquiryCountContext';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, ClipboardList, GitBranch, IndianRupee, LayoutDashboard, MessageSquare, ShieldCheck, UserRound, Users } from 'lucide-react';
import { clsx } from 'clsx';

function TeacherMenu() {
  const items = [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/teacher/students', label: 'My Students', icon: Users },
    { to: '/teacher/fees', label: 'Fees & History', icon: IndianRupee },
    { to: '/teacher/profile', label: 'Profile', icon: UserRound },
  ];
  return (
    <nav className="sidebar__menu" aria-label="Teacher menu">
      <div className="sidebar__group">
        <span className="sidebar__group-title">Teacher Portal</span>
        <ul className="sidebar__list" role="menubar">
          {items.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="sidebar__item" role="none">
              <NavLink to={to} end={end} className="sidebar__button" role="menuitem" title={label}>
                <Icon className="sidebar__icon" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function Sidebar() {
  const { isSidebarCollapsed, isSidebarVisible, isMobile } = useAppShell();
  const { user, logout } = useAuth();
  const { combinedUnreadTotal, error: countError } = useEnquiryCounts();
  const navigate = useNavigate();
  const location = useLocation();

  const isTeacher = user?.role === 'teacher';
  const dashboardPath = isTeacher ? '/teacher' : '/admin';

  const [reportsOpen, setReportsOpen] = useState(() => location.pathname.startsWith('/reports'));
  const isCollapsed = isSidebarCollapsed && !isMobile;

  const handleLogout = async (e) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  return (
    <aside
      className={clsx(
        'sidebar sidebar--lg sidebar--app',
        { 'is-collapsed': isCollapsed, 'is-visible': isSidebarVisible }
      )}
      data-stisla-sidebar
      data-collapsed={isCollapsed ? '' : undefined}
      aria-label="Main navigation"
    >
      <header className="sidebar__header">
        <NavLink to={dashboardPath} className="sidebar__brand" aria-label="Wellfind Academic">
          <img
            src="/blue-logo-wellfind.png"
            alt="Wellfind Academic"
            className="sidebar__brand-logo"
            style={{
              width: '38px',
              height: '38px',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <span>Wellfind Academic</span>
        </NavLink>
      </header>

      <div className="sidebar__search">
        <div className="input-group input-group--search">
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
            disabled={isCollapsed}
          />
        </div>
      </div>

      <div className="sidebar__content">
        {isTeacher ? <TeacherMenu /> : (
        <nav className="sidebar__menu" aria-label="Main menu">
          {/* Group 1: Store */}
          <div className="sidebar__group">
            <span className="sidebar__group-title">Store</span>
            <ul className="sidebar__list" role="menubar">
              <li className="sidebar__item" role="none">
                <NavLink
                  to={dashboardPath}
                  end
                  className="sidebar__button"
                  role="menuitem"
                  title="Dashboard"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M2 6.5c0-2.121 0-3.182.659-3.841S4.379 2 6.5 2s3.182 0 3.841.659S11 4.379 11 6.5s0 3.182-.659 3.841S8.621 11 6.5 11s-3.182 0-3.841-.659S2 8.621 2 6.5m11 11c0-2.121 0-3.182.659-3.841S15.379 13 17.5 13s3.182 0 3.841.659S22 15.379 22 17.5s0 3.182-.659 3.841S19.621 22 17.5 22s-3.182 0-3.841-.659S13 19.621 13 17.5"
                      opacity=".5"
                    />
                    <path
                      fill="currentColor"
                      d="M2 17.5c0-2.121 0-3.182.659-3.841S4.379 13 6.5 13s3.182 0 3.841.659S11 15.379 11 17.5s0 3.182-.659 3.841S8.621 22 6.5 22s-3.182 0-3.841-.659S2 19.621 2 17.5m11-11c0-2.121 0-3.182.659-3.841S15.379 2 17.5 2s3.182 0 3.841.659S22 4.379 22 6.5s0 3.182-.659 3.841S19.621 11 17.5 11s-3.182 0-3.841-.659S13 8.621 13 6.5"
                    />
                  </svg>
                  <span>Dashboard</span>
                </NavLink>
              </li>

              <li className="sidebar__item" role="none">
                <NavLink
                  to="/inquiries"
                  className="sidebar__button"
                  role="menuitem"
                  title="Inquiries"
                >
                  <MessageSquare className="sidebar__icon" />
                  <span>Inquiries</span>
                </NavLink>
                {countError ? (
                  <span className="sidebar__item-action">
                    <span
                      className="badge badge--danger"
                      title={`Failed to load unread count: ${countError}`}
                      aria-label="Error loading unread count"
                    >
                      !
                    </span>
                  </span>
                ) : combinedUnreadTotal > 0 ? (
                  <span className="sidebar__item-action">
                    <span className="badge badge--primary" title="Unread inquiries">
                      {combinedUnreadTotal}
                    </span>
                  </span>
                ) : null}
              </li>

            </ul>
          </div>

          {/* Group 2: Operations */}
          <div className="sidebar__group">
            <span className="sidebar__group-title">Operations</span>
            <ul className="sidebar__list" role="menubar">
              <li className="sidebar__item" role="none">
                <NavLink
                  to="/students"
                  className="sidebar__button"
                  role="menuitem"
                  title="Students"
                >
                  <UserRound className="sidebar__icon" />
                  <span>Students</span>
                </NavLink>
              </li>

              <li className="sidebar__item" role="none">
                <NavLink
                  to="/teachers"
                  className="sidebar__button"
                  role="menuitem"
                  title="Teachers"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9zm0 2.29L19.16 9L12 12.71L4.84 9zM17 15.9l-5 2.73l-5-2.73v-3.72l5 2.73l5-2.73z"
                    />
                  </svg>
                  <span>Teachers</span>
                </NavLink>
              </li>

              <li className="sidebar__item" role="none">
                <NavLink
                  to="/admin/allocation"
                  className="sidebar__button"
                  role="menuitem"
                  title="Allocation"
                >
                  <GitBranch className="sidebar__icon" />
                  <span>Allocation</span>
                </NavLink>
              </li>

              <li className="sidebar__item" role="none">
                <NavLink to="/admin/student-records" className="sidebar__button" role="menuitem" title="Student Records">
                  <ClipboardList className="sidebar__icon" />
                  <span>Student Records</span>
                </NavLink>
              </li>

              <li className="sidebar__item" role="none">
                <NavLink to="/admin/users" className="sidebar__button" role="menuitem" title="Users">
                  <ShieldCheck className="sidebar__icon" />
                  <span>Users</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Group 3: Insights */}
          <div className="sidebar__group">
            <span className="sidebar__group-title">Insights</span>
            <ul className="sidebar__list" role="menubar">
              <li
                className="sidebar__item"
                data-state={reportsOpen ? 'open' : 'closed'}
                role="none"
              >
                <NavLink
                  to="/reports"
                  className="sidebar__button"
                  role="menuitem"
                  title="Payout"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="1em"
                    height="1em"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M3.293 9.293C3 9.586 3 10.057 3 11v6c0 .943 0 1.414.293 1.707S4.057 19 5 19s1.414 0 1.707-.293S7 17.943 7 17v-6c0-.943 0-1.414-.293-1.707S5.943 9 5 9s-1.414 0-1.707.293"
                    />
                    <path
                      fill="currentColor"
                      d="M17.293 2.293C17 2.586 17 3.057 17 4v13c0 .943 0 1.414.293 1.707S18.057 19 19 19s1.414 0 1.707-.293S21 17.943 21 17V4c0-.943 0-1.414-.293-1.707S19.943 2 19 2s-1.414 0-1.707.293"
                      opacity=".4"
                    />
                    <path
                      fill="currentColor"
                      d="M10 7c0-.943 0-1.414.293-1.707S11.057 5 12 5s1.414 0 1.707.293S14 6.057 14 7v10c0 .943 0 1.414-.293 1.707S12.943 19 12 19s-1.414 0-1.707-.293S10 17.943 10 17z"
                      opacity=".7"
                    />
                    <path
                      fill="currentColor"
                      d="M3 21.25a.75.75 0 0 0 0 1.5h18a.75.75 0 0 0 0-1.5z"
                    />
                  </svg>
                  <span>Payout</span>
                </NavLink>
                <button
                  type="button"
                  className="sidebar__item-action"
                  data-stisla-sidebar-submenu-toggle
                  aria-expanded={reportsOpen}
                  aria-controls="nav-reports"
                  aria-label="Toggle Reports submenu"
                  onClick={(e) => {
                    e.preventDefault();
                    setReportsOpen((prev) => !prev);
                  }}
                >
                  <span className="sidebar__caret"></span>
                </button>
                <div className="sidebar__submenu" id="nav-reports">
                  <ul className="sidebar__list">
                    <li className="sidebar__item">
                      <NavLink to="/admin/student-payments" className="sidebar__button">
                        <span>Student Payments</span>
                      </NavLink>
                    </li>
                    <li className="sidebar__item">
                      <NavLink to="/admin/teacher-payments" className="sidebar__button">
                        <span>Teacher Payments</span>
                      </NavLink>
                    </li>
                    <li className="sidebar__item">
                      <NavLink to="/reports" className="sidebar__button">
                        <span>Billing</span>
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>

          <div className="sidebar__group">
            <span className="sidebar__group-title">Analytics</span>
            <ul className="sidebar__list" role="menubar">
              <li className="sidebar__item" role="none">
                <NavLink
                  to="/admin/google-analytics"
                  className="sidebar__button"
                  role="menuitem"
                  title="Google Analytics"
                >
                  <BarChart3 className="sidebar__icon" />
                  <span>Google Analytics</span>
                </NavLink>
              </li>
            </ul>
          </div>

        </nav>
        )}
      </div>

      <footer className="sidebar__footer">
        <ul className="sidebar__list" role="menubar">
          <li className="sidebar__item" role="none">
            <NavLink
              to={isTeacher ? '/teacher/settings' : '/settings'}
              className="sidebar__button"
              role="menuitem"
              title="Settings"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M14.279 2.152C13.909 2 13.439 2 12.5 2s-1.408 0-1.779.152a2 2 0 0 0-1.09 1.083c-.094.223-.13.484-.145.863a1.62 1.62 0 0 1-.796 1.353a1.64 1.64 0 0 1-1.579.008c-.338-.178-.583-.276-.825-.308a2.03 2.03 0 0 0-1.49.396c-.318.242-.553.646-1.022 1.453c-.47.807-.704 1.21-.757 1.605c-.07.526.074 1.058.4 1.479c.148.192.357.353.68.555c.477.297.783.803.783 1.361s-.306 1.064-.782 1.36c-.324.203-.533.364-.682.556a2 2 0 0 0-.399 1.479c.053.394.287.798.757 1.605s.704 1.21 1.022 1.453c.424.323.96.465 1.49.396c.242-.032.487-.13.825-.308a1.64 1.64 0 0 1 1.58.008c.486.28.774.795.795 1.353c.015.38.051.64.145.863c.204.49.596.88 1.09 1.083c.37.152.84.152 1.779.152s1.409 0 1.779-.152a2 2 0 0 0 1.09-1.083c.094-.223.13-.483.145-.863c.02-.558.309-1.074.796-1.353a1.64 1.64 0 0 1 1.579-.008c.338.178.583.276.825.308c.53.07 1.066-.073 1.49-.396c.318-.242.553-.646 1.022-1.453c.47-.807.704-1.21.757-1.605a2 2 0 0 0-.4-1.479c-.148-.192-.357-.353-.68-.555c-.477-.297-.783-.803-.783-1.361s.306-1.064.782-1.36c.324-.203.533-.364.682-.556a2 2 0 0 0 .399-1.479c-.053-.394-.287-.798-.757-1.605s-.704-1.21-1.022-1.453a2.03 2.03 0 0 0-1.49-.396c-.242.032-.487.13-.825.308a1.64 1.64 0 0 1-1.58-.008a1.62 1.62 0 0 1-.795-1.353c-.015-.38-.051-.64-.145-.863a2 2 0 0 0-1.09-1.083"
                  clipRule="evenodd"
                  opacity=".5"
                />
                <path
                  fill="currentColor"
                  d="M15.523 12c0 1.657-1.354 3-3.023 3s-3.023-1.343-3.023-3S10.83 9 12.5 9s3.023 1.343 3.023 3"
                />
              </svg>
              <span>Settings</span>
            </NavLink>
          </li>
          <li className="sidebar__item" role="none">
            <button
              type="button"
              onClick={handleLogout}
              className="sidebar__button w-full text-left cursor-pointer"
              role="menuitem"
              title="Log out"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M16 2h-1c-2.829 0-4.242 0-5.121.879S9 5.172 9 8v8c0 2.829 0 4.243.879 5.122c.878.878 2.292.878 5.119.878H16c2.828 0 4.242 0 5.121-.879C22 20.243 22 18.828 22 16V8c0-2.828 0-4.243-.879-5.121S18.828 2 16 2"
                  opacity=".5"
                />
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M15.75 12a.75.75 0 0 0-.75-.75H4.027l1.961-1.68a.75.75 0 1 0-.976-1.14l-3.5 3a.75.75 0 0 0 0 1.14l3.5 3a.75.75 0 1 0 .976-1.14l-1.96-1.68H15a.75.75 0 0 0 .75-.75"
                  clipRule="evenodd"
                />
              </svg>
              <span>Log out</span>
            </button>
          </li>
        </ul>
        <div className="copyright">
          <hr
            className="separator my-3"
            style={{ '--separator-color': 'var(--sidebar-submenu-border-color)' }}
          />
          <p
            className="text-xs text-muted-foreground"
            style={{ '--link-color': 'var(--color-foreground)' }}
          >
            Designed by{' '}
            <a
              href="https://nauv.al"
              className="link"
              target="_blank"
              rel="noreferrer"
            >
              Nauval
            </a>{' '}
            at{' '}
            <a
              href="https://enterprise.kredibel.com"
              className="link"
              target="_blank"
              rel="noreferrer"
            >
              Kredibel
            </a>
          </p>
        </div>
      </footer>
    </aside>
  );
}
