import { PageLoader } from '@/components/ui/Loaders'
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { homeForRole } from '@/services/roles';

export function ProtectedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <PageLoader fullScreen label="Loading…" />
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

