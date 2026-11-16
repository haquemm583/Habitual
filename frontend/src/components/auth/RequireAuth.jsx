/*
  RequireAuth.jsx

  Last modified by: Maaz Haque
  Last modified on: 11/14/2026
*/
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

function RequireAuth({ children }) {
  const { user, loading, error, checkSession } = useAuth();
  const location = useLocation();

  if (loading) return <p role="status">Checking your session...</p>;
  if (error) {
    return (
      <div>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => checkSession()} className="mt-4 rounded-md border border-field-border px-4 py-2 focus-visible:outline-2 focus-visible:outline-offset-2">
          Try again
        </button>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search + location.hash }} />;
  return children;
}

export default RequireAuth;
