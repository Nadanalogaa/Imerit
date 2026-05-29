import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "../store/auth";

interface Props {
  role?: Role;
  children: React.ReactNode;
}

export function RequireAuth({ role, children }: Props) {
  const user = useAuth((s) => s.currentUser);
  if (!user) {
    const loginPath =
      role === "employer" ? "/employer/login" :
      role === "admin" ? "/admin" :
      role === "super_admin" ? "/super-admin" :
      "/candidate/login";
    return <Navigate to={loginPath} replace />;
  }
  if (role && user.role !== role) {
    const home =
      user.role === "employer" ? "/employer/dashboard" :
      user.role === "candidate" ? "/candidate/dashboard" :
      "/";
    return <Navigate to={home} replace />;
  }
  return <>{children}</>;
}

export function RedirectIfAuthed({ to, children, forRole = "candidate" }: { to: string; children: React.ReactNode; forRole?: Role }) {
  const user = useAuth((s) => s.currentUser);
  if (user && user.role === forRole) return <Navigate to={to} replace />;
  return <>{children}</>;
}
