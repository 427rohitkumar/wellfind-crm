import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout, ErrorLayout } from './components/layout/Layout'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

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
import Allocation from './pages/allocation/Allocation'
import Allocations from './pages/admin/Allocations'
import StudentRecords from './pages/admin/StudentRecords'
import StudentRecordDetail from './pages/admin/StudentRecordDetail'
import Users from './pages/admin/Users'
import Reports from './pages/reports/Reports'
import StudentPayments from './pages/payments/StudentPayments'
import TeacherPayments from './pages/payments/TeacherPayments'
import Settings from './pages/settings/Settings'
import Profile from './pages/profile/Profile'
import Blank from './pages/Blank'

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import TeacherStudents from './pages/teacher/TeacherStudents'
import TeacherFees from './pages/teacher/TeacherFees'
import TeacherProfile from './pages/teacher/TeacherProfile'

// Auth pages
import Login from './pages/auth/Login'
import ForgotPassword from './pages/auth/ForgotPassword'

// Error pages
import Error403 from './pages/errors/Error403'
import Error404 from './pages/errors/Error404'
import Error500 from './pages/errors/Error500'

function App() {
  return (
    <Routes>
      {/* Default login route */}
      <Route path="/" element={<Login />} />
      <Route path="login" element={<Navigate to="/" replace />} />
      <Route path="forgot-password" element={<ForgotPassword />} />

      {/* Protected Admin Routes (super_admin only) */}
      <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
        <Route element={<Layout />}>
          <Route path="admin" element={<Dashboard />} />
          <Route path="admin/google-analytics" element={<WebsiteAnalytics />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="admin/student-enquiries/:id" element={<StudentEnquiryDetail />} />
          <Route path="admin/teacher-enquiries/:id" element={<TeacherEnquiryDetail />} />
          <Route path="orders" element={<Inquiries />} />
          <Route path="students" element={<Students />} />
          <Route path="admin/students/:id" element={<StudentDetail />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="students/new" element={<Navigate to="/students" replace />} />
          <Route path="products" element={<Students />} />
          <Route path="products/new" element={<Navigate to="/students" replace />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="admin/teachers/:id" element={<TeacherDetail />} />
          <Route path="teachers/:id" element={<TeacherDetail />} />
          <Route path="customers" element={<Teachers />} />
          <Route path="admin/allocation" element={<Allocations />} />
          <Route path="admin/allocation-legacy" element={<Allocation />} />
          <Route path="admin/student-records" element={<StudentRecords />} />
          <Route path="admin/student-records/:id" element={<StudentRecordDetail />} />
          <Route path="admin/users" element={<Users />} />
          <Route path="reports" element={<Reports />} />
          <Route path="admin/student-payments" element={<StudentPayments />} />
          <Route path="admin/teacher-payments" element={<TeacherPayments />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="blank" element={<Blank />} />
        </Route>
      </Route>

      {/* Protected Teacher Routes (teacher only) */}
      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
        <Route element={<Layout />}>
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="teacher/students" element={<TeacherStudents />} />
          <Route path="teacher/fees" element={<TeacherFees />} />
          <Route path="teacher/profile" element={<TeacherProfile />} />
          <Route path="teacher/settings" element={<Settings />} />
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
