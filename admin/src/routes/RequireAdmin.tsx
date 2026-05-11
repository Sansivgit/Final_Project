import { Navigate, Outlet } from "react-router-dom";

const AUTH_KEY = "volt:admin";

export function RequireAdmin() {
  const raw = typeof localStorage !== "undefined" ? localStorage.getItem(AUTH_KEY) : null;
  if (!raw) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
