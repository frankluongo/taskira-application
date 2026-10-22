import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/services/auth";
import { Spinner } from "@taskira/ui";

export function ProtectedRoute() {
  const { user } = useAuth();
  if (user === undefined) return <Spinner />;
  if (user === null) return <Navigate to="/login" replace />;
  return <Outlet />;
}
