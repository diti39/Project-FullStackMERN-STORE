import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Loader from "./Loader";

// Wrap routes with this. <ProtectedRoute adminOnly /> also requires the admin role.
export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />; // don't redirect before we know the session state

  if (!user) {
    // Remember where they wanted to go so login can send them back
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
