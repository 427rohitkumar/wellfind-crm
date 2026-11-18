import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { homeForRole } from '@/services/roles';

export function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // Check role authorization
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to the portal that matches this user's role
    const home = homeForRole(user.role);
    if (home) return <Navigate to={home} replace />;
    // Unsupported role
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;

