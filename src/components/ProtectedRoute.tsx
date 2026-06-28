/**
 * @file ProtectedRoute.tsx
 *
 * Wraps a route that requires authentication.
 * Redirects unauthenticated users to /login.
 * Shows a full-screen spinner while auth state is being resolved.
 */

import { Navigate } from 'react-router-dom';
import { useAuth }  from '../contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { user, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-primary">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
