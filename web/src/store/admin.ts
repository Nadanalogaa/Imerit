import { useAuth } from "./auth";

const ADMIN_CREDS: Record<string, { password: string; role: "admin" | "super_admin"; name: string }> = {
  "admin@itr.com": { password: "admin123", role: "admin", name: "Platform Admin" },
  "super@itr.com": { password: "super123", role: "super_admin", name: "Super Admin" },
};

export function adminLogin(email: string, password: string): "admin" | "super_admin" | null {
  const creds = ADMIN_CREDS[email.toLowerCase()];
  if (!creds || creds.password !== password) return null;

  // Ensure user exists in store and log them in.
  const { register, loginByEmail, markVerified } = useAuth.getState();
  const existing = useAuth.getState().findByEmail(email);
  if (!existing) {
    register({ role: creds.role, name: creds.name, email });
    markVerified(email); // also sets currentUser
  } else {
    loginByEmail(email);
  }
  return creds.role;
}

export function getAdminCreds() {
  return Object.entries(ADMIN_CREDS).map(([email, c]) => ({ email, password: c.password, role: c.role }));
}
