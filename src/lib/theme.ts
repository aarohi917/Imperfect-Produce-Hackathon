import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
let current: Theme = "light";
const listeners = new Set<() => void>();
export function applyTheme(theme: Theme) {
  current = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.style.colorScheme = theme;
  try { localStorage.setItem("imperfect-produce-theme", theme); } catch { /* Theme still works without storage. */ }
  listeners.forEach(listener => listener());
}
export function initializeTheme() {
  try { applyTheme(localStorage.getItem("imperfect-produce-theme") === "dark" ? "dark" : "light"); }
  catch { applyTheme("light"); }
}
export function useTheme() {
  return useSyncExternalStore(callback => { listeners.add(callback); return () => { listeners.delete(callback); }; }, () => current, () => "light" as Theme);
}