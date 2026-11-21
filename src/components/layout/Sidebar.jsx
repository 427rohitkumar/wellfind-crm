import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppShell } from '../../context/AppShellContext';
import { useEnquiryCounts } from '../../context/EnquiryCountContext';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { getMyApplication } from '@/services/teacherPortalService';
import { BarChart3, History, ClipboardCheck, ClipboardList, Mail, GitBranch, IndianRupee, LayoutDashboard, MessageSquare, ShieldCheck, UserRound, Users } from 'lucide-react';
import { clsx } from 'clsx';

function TeacherMenu() {
  const [approved, setApproved] = useState(false);
  useEffect(() => {
    let alive = true;
    getMyApplication()
      .then((app) => { if (alive) setApproved(Boolean(app?.approved)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const items = [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/teacher/application', label: 'Application Status', icon: ClipboardList },
    // Available once the application is approved.
    ...(approved
      ? [
          { to: '/teacher/students', label: 'My Students', icon: Users },
          { to: '/teacher/history', label: 'Allocation History', icon: History },
          { to: '/teacher/fees', label: 'Fees & History', icon: IndianRupee },
          { to: '/teacher/profile', label: 'Profile', icon: UserRound },
        ]
      : []),
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
  const { can } = usePermissions();
  const dashboardPath = isTeacher ? '/teacher' : '/admin';

  const [reportsOpen, setReportsOpen] = useState(() => location.pathname.startsWith('/admin/payouts/reports'));
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

              {(can('student_inquiries') || can('teacher_inquiries')) && (
              <li className="sidebar__item" role="none">
                <NavLink
                  to="/admin/inquiries"
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
              )}

            </ul>
          </div>

          {/* Group 2: Operations */}
          {(can('students') || can('teachers') || can('tests') || can('allocation') || can('mail') || can('users')) && (
          <div className="sidebar__group">
            <span className="sidebar__group-title">Operations</span>
            <ul className="sidebar__list" role="menubar">
              {can('students') && (
              <li className="sidebar__item" role="none">
                <NavLink
                  to="/admin/students"
                  className="sidebar__button"
                  role="menuitem"
                  title="Students"
                >
                  <UserRound className="sidebar__icon" />
                  <span>Students</span>
                </NavLink>
              </li>
              )}

              {can('teachers') && (
              <li className="sidebar__item" role="none">
                <NavLink
                  to="/admin/teachers"
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
              )}

              {can('tests') && (
              <li className="sidebar__item" role="none">
                <NavLink to="/admin/tests" className="sidebar__button" role="menuitem" title="Tests">
                  <ClipboardCheck className="sidebar__icon" />
                  <span>Tests</span>
                </NavLink>
              </li>
              )}

              {can('allocation') && (
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
              )}

              {can('mail') && (
              <li className="sidebar__item" role="none">
                <NavLink to="/admin/mail" className="sidebar__button" role="menuitem" title="Mail">
                  <Mail className="sidebar__icon" />
                  <span>Mail</span>
                </NavLink>
              </li>
              )}

              {can('users') && (
              <li className="sidebar__item" role="none">
                <NavLink to="/admin/users" className="sidebar__button" role="menuitem" title="Users">
                  <ShieldCheck className="sidebar__icon" />
                  <span>Users</span>
                </NavLink>
              </li>
              )}
            </ul>
          </div>
          )}

          {/* Group 3: Insights */}
          {can('payments') && (
          <div className="sidebar__group">
            <span className="sidebar__group-title">Insights</span>
            <ul className="sidebar__list" role="menubar">
              <li
                className="sidebar__item"
                data-state={reportsOpen ? 'open' : 'closed'}
                role="none"
              >
                <NavLink
                  to="/admin/payouts/reports"
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
                      <NavLink to="/admin/payouts/student-payments" className="sidebar__button">
                        <span>Student Payments</span>
                      </NavLink>
                    </li>
                    <li className="sidebar__item">
                      <NavLink to="/admin/payouts/teacher-payments" className="sidebar__button">
                        <span>Teacher Payments</span>
                      </NavLink>
                    </li>
                    <li className="sidebar__item">
                      <NavLink to="/admin/payouts/reports" className="sidebar__button">
                        <span>Billing &amp; Reports</span>
                      </NavLink>
                    </li>
                  </ul>
                </div>
              </li>
            </ul>
          </div>
          )}

          {can('analytics') && (
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
          )}

        </nav>
        )}
      </div>

      <footer className="sidebar__footer">
        <ul className="sidebar__list" role="menubar">
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
            Powered by{' '}
            <a
              href="https://thebuilderstudio.in/"
              className="link"
              target="_blank"
              rel="noreferrer"
            >
              Builder Studio
            </a>
          </p>
        </div>
      </footer>
    </aside>
  );
}
