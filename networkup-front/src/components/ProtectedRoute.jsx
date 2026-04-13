import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * ProtectedRoute
 * - Waits for auth to initialise before making any redirect decision
 * - Saves the current path so the user lands back after login
 * - Optionally restricts to specific roles
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  // ✅ Don't flash redirect while auth is loading
  if (!ready) return null;

  if (!user) {
    // ✅ FIX: save returnPath here, not in every individual page
    localStorage.setItem("returnPath", location.pathname + location.search);
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}