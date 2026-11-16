import { ApprovalFlow } from "@/components/ApprovalFlow";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useT, useLang, useSettings } from "@/lib/i18n";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { checkReport } from "@/lib/analytics";
import { destLabel, vegLabel } from "@/lib/vegetables";
import { AlertTriangle } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatMoney, formatDate } from "@/lib/localization";
import { pageMeta } from "@/lib/page-meta";
import { ReferencePhoto } from "@/components/ReferencePhoto";
import { VisualReportDetails } from "@/components/VisualReportDetails";

export const Route = createFileRoute("/_authenticated/approvals")({
  validateSearch: (search: Record<string, unknown>): { report?: string | undefined } => ({ report: typeof search['report'] === "string" ? search['report'] : undefined }),
  head: () => pageMeta("核对采收 — 丑蔬 Imperfect Produce", "核对员逐条核对采收记录、重量、等级和预计金额。"),
  component: Approvals,
});

function Approvals() {
  const { report } = Route.useSearch();
  const navigate = Route.useNavigate();
  const lang = useLang();
  const settings = useSettings();
  const t = useT();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [finances,setFinances]=useState<Record<string,{revenue:string;cost:string}>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: rows = [] } = useQuery({
    queryKey: ["approvals", tab, report],
    enabled: !!me?.isManagement,
    queryFn: async () => {
      let query = supabase.from("harvests").select("*");
      query = report ? query.eq("id", report) : query.eq("status", tab);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      const list = data ?? [];
      const ids = [...new Set(list.map((h) => h.farmer_id))];
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id,display_name").in("id", ids) : { data: [] };
      const paths = list.map((h) => h.photo_path).filter(Boolean) as string[];
      const { data: signed } = paths.length ? await supabase.storage.from("harvest-photos").createSignedUrls(paths, 3600) : { data: [] };
      return list.map((h) => ({
        ...h,
        farmer: profs?.find((p) => p.id === h.farmer_id)?.display_name ?? t("农户", "Farmer"),
        photo: signed?.find((s) => s.path === h.photo_path)?.signedUrl,
      }));
    },
  });

  const { data: approvedRef = [] } = useQuery({
    queryKey: ["approved-ref"], enabled: !!me?.isManagement,
    queryFn: async () => (await supabase.from("harvests").select("id,vegetable,quantity,expected_revenue,cost,status,destination,created_at,currency").eq("report_type", "harvest").eq("status", "approved").limit(1000)).data ?? [],
  });
  if (me && !me.isManagement) return <p>{t("只有核对员可以核对采收记录。", "Only the checker can check harvests.")}</p>;

  async function decide(id: string, status: "approved" | "rejected") {
    if(!me) return;
    const { error } = await supabase.from("harvests").update({ ...(finances[id]?{expected_revenue:Number(finances[id].revenue),cost:Number(finances[id].cost)}:{}), status, review_note: notes[id] || null, reviewed_by: me.user.id, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "approved" ? t("已批准，已通知核对员。", "Approved — checker notified.") : t("已驳回，已通知核对员。", "Rejected — checker notified."));
    qc.invalidateQueries({ queryKey: ["approvals"] });
  }

  return (
    <>
      <PageTitle title={t("核对员核对", "Check harvests")} sub={t("每条采收和出货数据经审核后才计入统计。审核后数据锁定不可修改。", "Every harvest counts only after approval. Approved numbers are locked.")} />
      <details className="mb-6 border-y border-border py-3"><summary className="cursor-pointer text-sm text-muted-foreground">{t("谁来核对？核对后会怎样？", "Who checks it, and what happens next?")}</summary><div className="mt-4"><ApprovalFlow /></div></details>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm"><Link to="/requests">{t("进出口申请","Import-export requests","आयात-निर्यात अनुरोध","आयात-निर्यात विनंत्या")}</Link></Button>
        {(["pending", "approved", "rejected"] as const).map((tb) => (
          <Button key={tb} size="sm" variant={tab === tb ? "default" : "outline"} onClick={() => { setTab(tb); if (report) void navigate({ search: { report: undefined } }); }} >{({ pending: t("待审核", "Pending"), approved: t("已批准", "Approved"), rejected: t("已驳回", "Rejected") })[tb]}</Button>
        ))}
      </div>
      {rows.length === 0 && <div className="py-8 text-muted-foreground">{t("暂无记录。", "Nothing here right now.")}</div>}
      <div className="space-y-5">
        {rows.map((h) => (
          <Card key={h.id} className="grid gap-0 overflow-hidden lg:grid-cols-[280px_1fr]">
            <div>{h.photo ? <img src={h.photo} alt={vegLabel(h.vegetable,lang)} className={`w-full ${h.report_type === "visual_intelligence" ? "object-contain" : "h-52 object-cover lg:h-full"}`} /> : <ReferencePhoto crop={h.vegetable} className="h-52 lg:h-full" />}{h.report_type === "visual_intelligence" && <div className="p-4"><VisualReportDetails value={h.visual_items} /></div>}</div>
            <div className="space-y-3 p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-lg font-semibold">{h.report_type === "visual_intelligence" ? t("视觉智能报告", "Visual Intelligence report", "दृश्य बुद्धिमत्ता रिपोर्ट", "दृश्य बुद्धिमत्ता अहवाल") : <>{vegLabel(h.vegetable, lang)} · {h.quantity} {t("公斤", "kg")} · {`${t("等级","Grade")} ${h.grade}`}</>}</div>
                  <div className="text-sm text-muted-foreground">{h.farmer}{h.report_type !== "visual_intelligence" && <>{h.field_name ? ` · ${h.field_name}` : ""} → {destLabel(h.destination, lang)} · {t("采收于", "harvested")}</>} {formatDate(h.harvest_date,settings)}</div>
                </div>
                <StatusBadge status={h.status} />
              </div>
              {h.report_type !== "visual_intelligence" && <div className="grid grid-cols-1 gap-3 border-y border-border py-4 text-sm sm:grid-cols-3">
                <div><div className="text-xs text-muted-foreground">{t("预计收入", "Expected revenue")}</div>{formatMoney(Number(h.expected_revenue),h.currency,lang)}</div>
                <div><div className="text-xs text-muted-foreground">{t("成本", "Cost")}</div>{formatMoney(Number(h.cost),h.currency,lang)}</div>
                <div><div className="text-xs text-muted-foreground">{t("单价/公斤", "Price/kg")}</div>{formatMoney(Number(h.expected_revenue) / (Number(h.quantity) || 1),h.currency,lang,2)}</div>
              </div>}
              {h.status === "pending" && checkReport(h, approvedRef, lang).map((f) => (
                <p key={f} className="flex items-center gap-2 rounded-md bg-warning/20 px-2 py-1 text-sm"><AlertTriangle className="h-4 w-4 text-accent" /> {f}</p>
              ))}
              {h.ai_summary && h.report_type !== "visual_intelligence" && <p className="text-sm"><span className="font-semibold">{t("AI：", "AI: ")}</span>{h.ai_summary}</p>}
              {h.notes && <p className="text-sm"><span className="font-semibold">{t("农户：", "Farmer: ")}</span>{h.notes}</p>}
              {h.review_note && <p className="text-sm"><span className="font-semibold">{t("核对员备注：", "Checker note: ")}</span>{h.review_note}</p>}
              {h.status === "pending" && (
                <>
                  {h.report_type !== "visual_intelligence" && <div className="grid grid-cols-2 gap-3"><div><label className="text-xs">{t("预计收入","Expected revenue")} ({h.currency})</label><Input aria-label={t("预计收入","Expected revenue")} type="number" min="0" step="any" value={finances[h.id]?.revenue??String(h.expected_revenue)} onChange={e=>setFinances(f=>({...f,[h.id]:{revenue:e.target.value,cost:f[h.id]?.cost??String(h.cost)}}))}/></div><div><label className="text-xs">{t("成本","Cost")} ({h.currency})</label><Input aria-label={t("成本","Cost")} type="number" min="0" step="any" value={finances[h.id]?.cost??String(h.cost)} onChange={e=>setFinances(f=>({...f,[h.id]:{cost:e.target.value,revenue:f[h.id]?.revenue??String(h.expected_revenue)}}))}/></div></div>}
                  <Input placeholder={t("给农户的备注（可选）", "Note for the farmer (optional)")} value={notes[h.id] ?? ""} onChange={(e) => setNotes({ ...notes, [h.id]: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={() => decide(h.id, "approved")}><Check className="h-4 w-4" /> {t("批准", "Approve")}</Button>
                    <Button variant="outline" onClick={() => decide(h.id, "rejected")}><X className="h-4 w-4" /> {t("驳回", "Reject")}</Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
