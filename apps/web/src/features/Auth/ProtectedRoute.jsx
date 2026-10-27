import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/lib/auth";
import { Spinner } from "@/base";

export function ProtectedRoute() {
  const { user } = useAuth();
  if (user === undefined) return <Spinner />;
  if (user === null) return <Navigate to="/login" replace />;
  return <Outlet />;
}
