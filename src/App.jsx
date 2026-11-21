import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { PageLoader } from './components/ui/Loaders'
import { Layout, ErrorLayout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RequireModule } from './components/auth/RequireModule'
import { ADMIN_ROLES } from './services/roles'

// Main app pages
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const WebsiteAnalytics = lazy(() => import('./pages/dashboard/WebsiteAnalytics'))
const Inquiries = lazy(() => import('./pages/inquiries/Inquiries'))
const StudentEnquiryDetail = lazy(() => import('./pages/inquiries/StudentEnquiryDetail'))
const TeacherEnquiryDetail = lazy(() => import('./pages/inquiries/TeacherEnquiryDetail'))
const Students = lazy(() => import('./pages/students/Students'))
const StudentDetail = lazy(() => import('./pages/students/StudentDetail'))
const Teachers = lazy(() => import('./pages/teachers/Teachers'))
const TeacherDetail = lazy(() => import('./pages/teachers/TeacherDetail'))
const Tests = lazy(() => import('./pages/tests/Tests'))
const TestDetail = lazy(() => import('./pages/tests/TestDetail'))
const Allocation = lazy(() => import('./pages/allocation/Allocation'))
const Allocations = lazy(() => import('./pages/admin/Allocations'))
const Users = lazy(() => import('./pages/admin/Users'))
const Mail = lazy(() => import('./pages/admin/Mail'))
const StudentPayments = lazy(() => import('./pages/payouts/StudentPayments'))
const TeacherPayments = lazy(() => import('./pages/payouts/TeacherPayments'))
const PayoutReports = lazy(() => import('./pages/payouts/PayoutReports'))
const Profile = lazy(() => import('./pages/profile/Profile'))

// Teacher pages
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const TeacherApplication = lazy(() => import('./pages/teacher/TeacherApplication'))
const TeacherStudents = lazy(() => import('./pages/teacher/TeacherStudents'))
const TeacherStudentDetail = lazy(() => import('./pages/teacher/TeacherStudentDetail'))
const TeacherFees = lazy(() => import('./pages/teacher/TeacherFees'))
const TeacherHistory = lazy(() => import('./pages/teacher/TeacherHistory'))
const TeacherProfile = lazy(() => import('./pages/teacher/TeacherProfile'))

// Auth pages
import Login from './pages/auth/Login'
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))

// Error pages
const Error403 = lazy(() => import('./pages/errors/Error403'))
const Error404 = lazy(() => import('./pages/errors/Error404'))
const Error500 = lazy(() => import('./pages/errors/Error500'))

/** Redirect that keeps the :id of the old URL. */
function Redirect({ to }) {
  const params = useParams()
  return <Navigate to={to.replace(/:(\w+)/g, (_, k) => params[k] ?? '')} replace />
}

const G = (module, el, level = 'read') => <RequireModule module={module} level={level}>{el}</RequireModule>

function App() {
  return (
    <Suspense fallback={<PageLoader label="Loading…" />}>
    <Routes>
      {/* Default login route */}
      <Route path="/" element={<Login />} />
      <Route path="login" element={<Navigate to="/" replace />} />
      <Route path="forgot-password" element={<ForgotPassword />} />

      {/* Protected Admin Routes (super admin + staff roles; each page also checks the role's module access). */}
      <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
        <Route element={<Layout />}>
          <Route path="admin" element={<Dashboard />} />
          <Route path="admin/google-analytics" element={G('analytics', <WebsiteAnalytics />)} />

          <Route path="admin/inquiries" element={<RequireModule anyOf={['student_inquiries', 'teacher_inquiries']}><Inquiries /></RequireModule>} />
          <Route path="admin/student-enquiries/:id" element={G('student_inquiries', <StudentEnquiryDetail />)} />
          <Route path="admin/teacher-enquiries/:id" element={G('teacher_inquiries', <TeacherEnquiryDetail />)} />

          <Route path="admin/students" element={G('students', <Students />)} />
          <Route path="admin/students/:id" element={G('students', <StudentDetail />)} />
          <Route path="admin/teachers" element={G('teachers', <Teachers />)} />
          <Route path="admin/teachers/:id" element={G('teachers', <TeacherDetail />)} />
          <Route path="admin/tests" element={G('tests', <Tests />)} />
          <Route path="admin/tests/:id" element={G('tests', <TestDetail />)} />
          <Route path="admin/allocation" element={G('allocation', <Allocations />)} />
          <Route path="admin/allocation-legacy" element={G('allocation', <Allocation />)} />
          <Route path="admin/student-records" element={<Navigate to="/admin/students" replace />} />
          <Route path="admin/student-records/:id" element={<Navigate to="/admin/students" replace />} />
          <Route path="admin/users" element={G('users', <Users />)} />
          <Route path="admin/mail" element={G('mail', <Mail />)} />

          {/* Payout section */}
          <Route path="admin/payouts" element={<Navigate to="/admin/payouts/reports" replace />} />
          <Route path="admin/payouts/student-payments" element={G('payments', <StudentPayments />)} />
          <Route path="admin/payouts/teacher-payments" element={G('payments', <TeacherPayments />)} />
          <Route path="admin/payouts/reports" element={G('payments', <PayoutReports />)} />

          <Route path="admin/profile" element={<Profile />} />

          {/* Old URLs keep working: they redirect into /admin. */}
          <Route path="inquiries" element={<Navigate to="/admin/inquiries" replace />} />
          <Route path="orders" element={<Navigate to="/admin/inquiries" replace />} />
          <Route path="students" element={<Navigate to="/admin/students" replace />} />
          <Route path="students/:id" element={<Redirect to="/admin/students/:id" />} />
          <Route path="products" element={<Navigate to="/admin/students" replace />} />
          <Route path="teachers" element={<Navigate to="/admin/teachers" replace />} />
          <Route path="teachers/:id" element={<Redirect to="/admin/teachers/:id" />} />
          <Route path="customers" element={<Navigate to="/admin/teachers" replace />} />
          <Route path="reports" element={<Navigate to="/admin/payouts/reports" replace />} />
          <Route path="profile" element={<Navigate to="/admin/profile" replace />} />
          <Route path="admin/payments" element={<Navigate to="/admin/payouts/reports" replace />} />
          <Route path="admin/student-payments" element={<Navigate to="/admin/payouts/student-payments" replace />} />
          <Route path="admin/teacher-payments" element={<Navigate to="/admin/payouts/teacher-payments" replace />} />
        </Route>
      </Route>

      {/* Protected Teacher Routes (teacher only) */}
      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route element={<Layout />}>
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="teacher/application" element={<TeacherApplication />} />
          <Route path="teacher/students" element={<TeacherStudents />} />
          <Route path="teacher/students/:id" element={<TeacherStudentDetail />} />
          <Route path="teacher/fees" element={<TeacherFees />} />
          <Route path="teacher/history" element={<TeacherHistory />} />
          <Route path="teacher/profile" element={<TeacherProfile />} />
        </Route>
      </Route>

      {/* Error routes with error layout */}
      <Route element={<ErrorLayout />}>
        <Route path="403" element={<Error403 />} />
        <Route path="404" element={<Error404 />} />
        <Route path="500" element={<Error500 />} />
      </Route>

      {/* Redirect unknown routes to 404 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
    </Suspense>
  )
}

export default App
