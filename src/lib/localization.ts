import { translations } from "./translations";
export type Lang = "zh" | "en" | "hi" | "mr";
export type Currency = "USD" | "INR" | "CNY" | "GBP" | "JPY";
export type Settings = { language: Lang; currency: Currency; timeZone: string; weekStartsOn?: "sunday" | "monday"; monitoringEnabled?: boolean; proactiveNotifications?: boolean };
export const LANGUAGES = ["zh", "en", "hi", "mr"] as const;
export const CURRENCIES = ["USD", "INR", "CNY", "GBP", "JPY"] as const;
export const locales: Record<Lang, string> = { zh: "zh-CN", en: "en-US", hi: "hi-IN", mr: "mr-IN" };
export const languageNames: Record<Lang, string> = { zh: "简体中文", en: "English", hi: "हिन्दी", mr: "मराठी" };
export const defaults: Settings = { language: "zh", currency: "CNY", timeZone: "UTC", weekStartsOn: "monday", monitoringEnabled: true, proactiveNotifications: true };
export function validTimeZone(value: string) {
  try { new Intl.DateTimeFormat("en", { timeZone: value }).format(0); return true; } catch { return false; }
}
export function normalizeSettings(value: Partial<Settings>): Settings {
  return { language: LANGUAGES.find(l => l === value.language) ?? defaults.language, currency: CURRENCIES.find(c => c === value.currency) ?? defaults.currency, timeZone: value.timeZone && validTimeZone(value.timeZone) ? value.timeZone : "UTC", weekStartsOn: value.weekStartsOn === "sunday" ? "sunday" : "monday", monitoringEnabled: value.monitoringEnabled ?? true, proactiveNotifications: value.proactiveNotifications ?? true };
}
export function translate(lang: Lang, zh: string, en: string, hi?: string, mr?: string): string {
  if (lang === "zh") return zh;
  if (lang === "en") return en;
  return (lang === "hi" ? hi : mr) ?? translations[en]?.[lang] ?? en;
}
export function formatMoney(value: number, currency: string = "CNY", lang: Lang = "zh", digits?: number) {
  return new Intl.NumberFormat(locales[lang], { style: "currency", currency, currencyDisplay: "symbol", ...(digits === undefined ? {} : { minimumFractionDigits: digits, maximumFractionDigits: digits }) }).format(value);
}
export function dateKey(value: Date | string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function formatDate(value: string, settings: Settings, timestamp = false) {
  // A harvest or deadline is a calendar date, not an instant. Never shift it.
  const calendar = /^\d{4}-\d{2}-\d{2}$/.test(value);
  return new Intl.DateTimeFormat(locales[settings.language], { timeZone: calendar ? "UTC" : settings.timeZone, year: "numeric", month: "long", day: "numeric", ...(timestamp && !calendar ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(new Date(calendar ? value + "T12:00:00Z" : value));
}
export function currencyRows<T extends {currency?: string}>(rows: T[], currency: string): T[] {
  return rows.filter(row => (row.currency ?? "CNY") === currency);
}