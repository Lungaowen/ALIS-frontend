import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/nav";

interface Props {
  children: JSX.Element;
  allow?: Role[];
}

export function ProtectedRoute({ children, allow }: Props) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (allow && role && !allow.includes(role)) {
    return <Navigate to={ROLE_HOME[role]} replace />;
  }
  return children;
}
