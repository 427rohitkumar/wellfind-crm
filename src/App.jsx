import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Layout, ErrorLayout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RequireModule } from './components/auth/RequireModule'
import { ADMIN_ROLES } from './services/roles'

// Main app pages
import Dashboard from './pages/dashboard/Dashboard'
import WebsiteAnalytics from './pages/dashboard/WebsiteAnalytics'
import Inquiries from './pages/inquiries/Inquiries'
import StudentEnquiryDetail from './pages/inquiries/StudentEnquiryDetail'
import TeacherEnquiryDetail from './pages/inquiries/TeacherEnquiryDetail'
import Students from './pages/students/Students'
import StudentDetail from './pages/students/StudentDetail'
import Teachers from './pages/teachers/Teachers'
import TeacherDetail from './pages/teachers/TeacherDetail'
import Tests from './pages/tests/Tests'
import TestDetail from './pages/tests/TestDetail'
import Allocation from './pages/allocation/Allocation'
import Allocations from './pages/admin/Allocations'
import Users from './pages/admin/Users'
import Mail from './pages/admin/Mail'
import StudentPayments from './pages/payouts/StudentPayments'
import TeacherPayments from './pages/payouts/TeacherPayments'
import PayoutReports from './pages/payouts/PayoutReports'
import Profile from './pages/profile/Profile'

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherApplication from './pages/teacher/TeacherApplication'
import TeacherStudents from './pages/teacher/TeacherStudents'
import TeacherStudentDetail from './pages/teacher/TeacherStudentDetail'
import TeacherFees from './pages/teacher/TeacherFees'
import TeacherHistory from './pages/teacher/TeacherHistory'
import TeacherProfile from './pages/teacher/TeacherProfile'

// Auth pages
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'

// Error pages
import Error403 from './pages/errors/Error403'
import Error404 from './pages/errors/Error404'
import Error500 from './pages/errors/Error500'

/** Redirect that keeps the :id of the old URL. */
function Redirect({ to }) {
  const params = useParams()
  return <Navigate to={to.replace(/:(\w+)/g, (_, k) => params[k] ?? '')} replace />
}

const G = (module, el, level = 'read') => <RequireModule module={module} level={level}>{el}</RequireModule>

function App() {
  return (
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
  )
}

export default App
