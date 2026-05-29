import { create } from "zustand";
import { get as load, set as save, KEYS } from "../lib/storage";

export type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  set: (t: Theme) => void;
}

const applyToDocument = (t: Theme) => {
  document.documentElement.classList.toggle("dark", t === "dark");
};

const initial: Theme = load<Theme>(KEYS.theme, "light");
applyToDocument(initial);

export const useTheme = create<ThemeState>((set) => ({
  theme: initial,
  toggle: () =>
    set((s) => {
      const next: Theme = s.theme === "dark" ? "light" : "dark";
      save(KEYS.theme, next);
      applyToDocument(next);
      return { theme: next };
    }),
  set: (t) =>
    set(() => {
      save(KEYS.theme, t);
      applyToDocument(t);
      return { theme: t };
    }),
}));
