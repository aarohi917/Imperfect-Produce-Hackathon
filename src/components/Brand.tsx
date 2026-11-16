import { useT } from "@/lib/i18n";

export function Brand({ compact = false }: { compact?: boolean }) {
  const t = useT();
  return <div className="flex min-w-0 items-center gap-2 text-foreground xl:gap-3">
    <svg viewBox="0 0 40 48" className="h-10 w-8 shrink-0 text-primary" fill="none" aria-hidden="true">
      <path d="M20 43V19M20 28C7 29 4 19 5 11c10-1 17 6 15 17ZM20 21C19 9 27 4 35 5c1 10-5 17-15 16Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M9 36c0-5 6-8 11-8s12 4 11 9c-1 4-6 8-11 8S9 41 9 36Z" stroke="currentColor" strokeWidth="1.7"/>
    </svg>
    {!compact && <span className="min-w-0 font-display text-lg leading-tight xl:text-xl">{t("丑蔬", "Imperfect Produce", "इम्परफेक्ट प्रोड्यूस", "इम्परफेक्ट प्रोड्यूस")}</span>}
  </div>;
}