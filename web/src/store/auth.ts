import { create } from "zustand";
import { get as load, set as save, remove, KEYS } from "../lib/storage";

export type Role = "candidate" | "employer" | "admin" | "super_admin";

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  mobile?: string;
  company?: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthState {
  currentUser: User | null;
  register: (data: {
    role: Role;
    name: string;
    email: string;
    mobile?: string;
    company?: string;
  }) => User;
  markVerified: (email: string) => void;
  loginByEmail: (email: string) => User | null;
  logout: () => void;
  findByEmail: (email: string) => User | null;
}

const userId = () => "u_" + Math.random().toString(36).slice(2, 10);

export const useAuth = create<AuthState>((set) => ({
  currentUser: load<User | null>(KEYS.currentUser, null),

  register: ({ role, name, email, mobile, company }) => {
    const users = load<User[]>(KEYS.users, []);
    const existing = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (existing) return existing;

    const next: User = {
      id: userId(),
      role,
      name,
      email,
      mobile,
      company,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };
    save(KEYS.users, [next, ...users]);
    return next;
  },

  markVerified: (email) => {
    const users = load<User[]>(KEYS.users, []);
    const updated = users.map((u) =>
      u.email.toLowerCase() === email.toLowerCase() ? { ...u, emailVerified: true } : u
    );
    save(KEYS.users, updated);

    const user = updated.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
    if (user) {
      save(KEYS.currentUser, user);
      set({ currentUser: user });
    }
  },

  loginByEmail: (email) => {
    const users = load<User[]>(KEYS.users, []);
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
    if (!user) return null;
    save(KEYS.currentUser, user);
    set({ currentUser: user });
    return user;
  },

  logout: () => {
    remove(KEYS.currentUser);
    set({ currentUser: null });
  },

  findByEmail: (email) => {
    const users = load<User[]>(KEYS.users, []);
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null;
  },
}));

/** All registered users (helper for admin-y views). */
export function allUsers(): User[] {
  return load<User[]>(KEYS.users, []);
}
