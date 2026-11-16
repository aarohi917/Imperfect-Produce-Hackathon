import { Camera, ShieldCheck, Bell } from "lucide-react";
import { useT } from "@/lib/i18n";

/** Visual explanation: farmer reports → checker checks → Checkers are notified. */
export function ApprovalFlow() {
  const t = useT();
  const nodes = [
    { icon: Camera, who: t("农户", "Farmer"), what: t("拍照、称重、上报", "Photographs, weighs, reports") },
    { icon: ShieldCheck, who: t("核对员", "The checker"), what: t("核对数字，批准或驳回", "Checks the numbers, approves or rejects") },
    { icon: Bell, who: t("核对员", "Checker"), what: t("收到采收动态通知", "Receives harvest update alerts","कटाई अपडेट प्राप्त करता है","कापणी अपडेट मिळतात") },
  ];
  return (
    <div className="border-y border-border py-5">
      <ol className="grid gap-4 sm:grid-cols-3">
        {nodes.map((n, i) => (
          <li key={i} className="relative flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center text-primary"><n.icon className="h-6 w-6" strokeWidth={1.5} /></div>
            <div>
              <div className="font-semibold text-primary">{i + 1}. {n.who}</div>
              <div className="text-sm text-muted-foreground">{n.what}</div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
        {t("核对通过后进入正式统计并锁定。采收通知发给核对员，农户在记录中查看审核结果。",
           "Approved batches enter official totals and are locked. Harvest alerts go to Checkers; farmers see review results in their records.")}
      </p>
    </div>
  );
}
