import { Navigate } from "react-router-dom";
import { hasActiveSession } from "../../services/authService";
import type { ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!hasActiveSession()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
