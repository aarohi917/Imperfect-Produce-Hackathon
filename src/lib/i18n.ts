import { useSyncExternalStore } from "react";
import { defaults, normalizeSettings, translate, locales, type Settings, type Lang } from "./localization";
export type { Lang } from "./localization";
const KEY = "imperfect-produce-settings";
const listeners = new Set<() => void>();
let current: Settings = defaults;
export function getSettings() { return current; }
export function applySettings(value: Settings) {
  current = normalizeSettings(value);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(current));
    document.documentElement.lang = locales[current.language];
  }
  listeners.forEach(f => f());
}
export function initializeSettings() {
  const stored = window.localStorage.getItem(KEY);
  try {
    applySettings(stored ? normalizeSettings(JSON.parse(stored)) : { ...defaults, language: window.localStorage.getItem("rootwise-lang") === "en" ? "en" : "zh", timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" });
  } catch { applySettings(defaults); }
}
export function useSettings(): Settings {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    getSettings,
    () => defaults,
  );
}
export function useLang(): Lang { return useSettings().language; }
export function setLang(language: Lang) { applySettings({...current, language}); }
export function useT() {
  const lang = useLang();
  return (zh: string, en: string, hi?: string, mr?: string) => translate(lang, zh, en, hi, mr);
}
