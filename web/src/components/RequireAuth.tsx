import { Navigate } from "react-router-dom";
import { HOME_PATH, LOGIN_PATH, hasRole, useAuth, type Role } from "../store/auth";

interface Props {
  role?: Role;
  children: React.ReactNode;
}

export function RequireAuth({ role, children }: Props) {
  const user = useAuth((s) => s.currentUser);
  if (!user) return <Navigate to={role ? LOGIN_PATH[role] : LOGIN_PATH.candidate} replace />;
  if (role && !hasRole(user.role, role)) return <Navigate to={HOME_PATH[user.role]} replace />;
  return <>{children}</>;
}

export function RedirectIfAuthed({ to, children, forRole = "candidate" }: { to: string; children: React.ReactNode; forRole?: Role }) {
  const user = useAuth((s) => s.currentUser);
  if (user && hasRole(user.role, forRole)) return <Navigate to={to} replace />;
  return <>{children}</>;
}
