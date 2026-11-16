import { useT } from "@/lib/i18n";

const styles: Record<string, string> = {
  pending: "bg-warning/25 text-foreground",
  approved: "bg-success/20 text-primary",
  rejected: "bg-destructive/15 text-destructive",
};
export function StatusBadge({ status }: { status: string }) {
  const t = useT();
  const label: Record<string, string> = { pending: t("等待核对", "Waiting to be checked"), approved: t("已批准", "Approved"), rejected: t("已驳回", "Rejected") };
  return <span className={`inline-flex h-fit shrink-0 items-center rounded-sm px-2.5 py-0.5 text-xs font-semibold ${styles[status] ?? ""}`}>{label[status] ?? status}</span>;
}
