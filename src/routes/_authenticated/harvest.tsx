import { createFileRoute, Link } from "@tanstack/react-router";
import { useT, useLang, useSettings } from "@/lib/i18n";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Camera, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeHarvestPhoto } from "@/lib/ai.functions";
import { useMe } from "@/lib/auth";
import { loadOperations, submitOperationalHarvest } from "@/lib/operations.functions";
import { VEGETABLES, destLabel, vegLabel } from "@/lib/vegetables";
import { PageTitle } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { dateKey, formatDate, formatMoney } from "@/lib/localization";
import { getSettings } from "@/lib/i18n";
import { pageMeta } from "@/lib/page-meta";
import { ReferencePhoto } from "@/components/ReferencePhoto";
import { ApprovalFlow } from "@/components/ApprovalFlow";

export const Route = createFileRoute("/_authenticated/harvest")({
  head: () => pageMeta("上报采收 — 丑蔬 Imperfect Produce", "上传采收照片，填写实际称重与预计金额并提交核对。"),
  component: HarvestPage,
});

function resize(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const source = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(source);
      try {
      const max = 1280, s = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * s; c.height = img.height * s;
      const ctx = c.getContext("2d");
      if (!ctx) { reject(new Error("Image unavailable")); return; }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.82));
      } catch (error) { reject(error); }
    };
    img.onerror = () => { URL.revokeObjectURL(source); reject(new Error("Image unavailable")); };
    img.src = source;
  });
}

const today = () => dateKey(new Date(),getSettings().timeZone);
const empty = () => ({ vegetable: "", quantity: "", grade: "A", field_name: "", harvest_date: today(), destination: "market", expected_revenue: "", cost: "", notes: "", ai_summary: "" });

function HarvestPage() {
  const lang = useLang();
  const settings = useSettings();
  const t = useT();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeHarvestPhoto);
  const submitOperation = useServerFn(submitOperationalHarvest);
  const [photo, setPhoto] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState<"ai" | "save" | null>(null);
  const set = (k: keyof ReturnType<typeof empty>, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: mine = [] } = useQuery({
    queryKey: ["my-harvests", me?.user.id],
    enabled: !!me,
    queryFn: async () => { if(!me) return []; if(!me.isManagement) return (await loadOperations()).filter(r=>r.farmer_id===me.user.id).slice(0,20).map(r=>({...r,expected_revenue:null,cost:null,currency:null,review_note:null})); const {data,error}=await supabase.from("harvests").select("*").eq("report_type", "harvest").eq("farmer_id", me.user.id).order("created_at", { ascending: false }).limit(20); if(error) throw error; return data ?? []; },
  });

  async function onFile(f?: File) {
    if (!f || busy) return;
    let url: string;
    try { url = await resize(f); }
    catch {
      toast.error(t("无法读取照片，请选择另一张照片或手动填写。", "Could not read the photo. Choose another image or enter the details manually.", "फोटो नहीं पढ़ सका। दूसरी तस्वीर चुनें या जानकारी खुद भरें।", "फोटो वाचता आला नाही. दुसरी प्रतिमा निवडा किंवा माहिती स्वतः भरा."));
      return;
    }
    setPhoto(url);
    setBusy("ai");
    try {
      const est = await analyze({ data: { dataUrl: url, lang } });
      setForm((x) => ({ ...x, vegetable: est.vegetable || x.vegetable, quantity: String(est.quantity), grade: est.grade, ai_summary: est.summary }));
      toast.success(t("AI 估算完成，请核对并修改。", "AI estimate ready \u2014 please check and adjust."));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("AI 估算失败，请手动填写。", "AI estimate failed. Please fill in manually."));
    } finally { setBusy(null); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!me) return;
    if (!form.vegetable) { toast.error(t("请选择蔬菜。", "Choose a vegetable.")); return; }
    if (!(Number(form.quantity) > 0)) { toast.error(t("重量必须大于 0 公斤。", "Weight must be more than 0 kg.")); return; }
    if (form.harvest_date > today()) { toast.error(t("采收日期不能晚于今天。", "Harvest date can't be in the future.")); return; }
    setBusy("save");
    try {
      let photo_path: string | null = null;
      if (photo) {
        const blob = await (await fetch(photo)).blob();
        photo_path = `${me.user.id}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from("harvest-photos").upload(photo_path, blob, { contentType: "image/jpeg" });
        if (error) throw error;
      }
      if(!me.isManagement) {
        await submitOperation({data:{photo_path,vegetable:form.vegetable,quantity:Number(form.quantity),grade:form.grade as "A"|"B"|"C",field_name:form.field_name.trim()||null,harvest_date:form.harvest_date,destination:form.destination as "market"|"factory",notes:form.notes||null,ai_summary:form.ai_summary||null}});
      } else {
      const { error } = await supabase.from("harvests").insert({
        farmer_id: me.user.id, photo_path, currency: settings.currency,
        vegetable: form.vegetable, quantity: Number(form.quantity), unit: "kg", grade: form.grade, field_name: form.field_name.trim() || null, harvest_date: form.harvest_date, destination: form.destination,
        expected_revenue: Number(form.expected_revenue) || 0, cost: Number(form.cost) || 0,
        notes: form.notes || null, ai_summary: form.ai_summary || null,
      });
      if (error) throw error;
      }
      toast.success(t("已提交！核对员已收到通知。", "Sent! The checker has been notified."));
      setForm(empty()); setPhoto(null);
      qc.invalidateQueries({ queryKey: ["my-harvests"] });
      qc.invalidateQueries({queryKey:["operations"]});
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("提交失败。", "Could not submit."));
    } finally { setBusy(null); }
  }

  return (
    <>
      <PageTitle title={t("上报采收", "Report a harvest")}  />
      <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
        <section className="border-t border-border pt-5">
          <form onSubmit={submit} className="space-y-5">
            <h2 className="font-sans text-sm font-semibold">01 · {t("采收照片", "Harvest photo")}</h2>
            <label className="relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden border border-dashed border-border bg-muted text-muted-foreground">
              {photo ? <img src={photo} alt={t("采收照片", "Harvest photo")} className="h-full w-full object-cover" /> : (<><ReferencePhoto className="absolute inset-0" /><span className="absolute inset-0 bg-photo-scrim/45" /><span className="relative flex flex-col items-center gap-2 bg-background/95 px-5 py-4 text-foreground"><Camera className="h-7 w-7" />{t("点击拍照或上传照片", "Tap to take or upload a photo")}</span></>)}
              <input type="file" accept="image/*" capture="environment" disabled={busy !== null} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ""; void onFile(file); }} />
            </label>
            {busy === "ai" && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {t("AI 正在估算…", "AI is estimating\u2026")}</p>}
            {form.ai_summary && <p className="flex gap-2 rounded bg-secondary p-3 text-sm"><Sparkles className="h-4 w-4 shrink-0 text-accent" /> {form.ai_summary}</p>}
            <h2 className="border-t border-border pt-5 font-sans text-sm font-semibold">02 · {t("记录与依据", "Records & evidence")}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>{t("蔬菜", "Vegetable")}</Label>
                <select required className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm" value={form.vegetable} onChange={(e) => set("vegetable", e.target.value)}>
                  <option value="">{t("请选择…", "Choose\u2026")}</option>{VEGETABLES.map((v) => <option key={v} value={v}>{vegLabel(v, lang)}</option>)}
                </select></div>
              <div><Label>{t("重量（公斤）", "Weight (kg)")}</Label><Input required type="number" min="0.1" step="0.1" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} /></div>
              <div><Label>{t("等级", "Grade")}</Label>
                <select className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm" value={form.grade} onChange={(e) => set("grade", e.target.value)}>
                  <option value="A">{t("A 级 — 上市", "A \u2014 market")}</option><option value="B">{t("B 级 — 轻微瑕疵", "B \u2014 blemished")}</option><option value="C">{t("C 级 — 加工", "C \u2014 processing")}</option>
                </select></div>
              <div><Label>{t("地块", "Field / plot")}</Label><Input value={form.field_name} onChange={(e) => set("field_name", e.target.value)} placeholder={t("例如：北区 2 号", "e.g. North 2")} /></div>
              <div><Label>{t("采收日期", "Harvest date")}</Label><Input type="date" max={today()} value={form.harvest_date} onChange={(e) => set("harvest_date", e.target.value)} /></div>
              <div className="col-span-2"><Label>{t("去向", "Going to")}</Label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {(["market", "factory"] as const).map((d) => (
                    <Button key={d} type="button" variant={form.destination === d ? "default" : "outline"} onClick={() => set("destination", d)} >{destLabel(d, lang)}</Button>
                  ))}
                </div></div>
              {me?.isManagement && <><div><Label>{`${t("预计收入", "Expected revenue")} (${settings.currency})`}</Label><Input type="number" min="0" step="any" value={form.expected_revenue} onChange={(e) => set("expected_revenue", e.target.value)} /></div>
              <div><Label>{`${t("成本", "Cost")} (${settings.currency})`}</Label><Input type="number" min="0" step="any" value={form.cost} onChange={(e) => set("cost", e.target.value)} /></div></>}
              <div className="col-span-2"><Label>{t("备注", "Notes")}</Label><Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder={t("质量、天气等需要核对员了解的情况", "Quality, weather, anything the checker should know")} /></div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={!!busy}>{busy === "save" ? t("提交中…", "Sending\u2026") : t("提交核对", "Send to be checked")}</Button>
          </form>
        </section>
        <div className="border-t border-border pt-5">
          <details className="mb-6 border-b border-border pb-4"><summary className="cursor-pointer text-sm font-semibold">{t("谁来核对？核对后会怎样？", "Who checks it, and what happens next?")}</summary><ApprovalFlow /></details>
          <h2 className="mb-3 text-xl">{t("我的近期记录", "My recent reports")}</h2>
          <div className="space-y-2">
            {mine.length === 0 && <p className="text-sm text-muted-foreground">{t("暂无记录。", "No reports yet.")}</p>}
            {mine.map((h) => (
              <Card key={h.id} className="flex flex-wrap items-center justify-between gap-3 border-x-0 border-t-0 bg-transparent py-4">
                <div>
                  <div className="font-semibold">{vegLabel(h.vegetable, lang)} · {h.quantity} {t("公斤", "kg")} · {`${t("等级","Grade")} ${h.grade}`}</div>
                  <div className="text-xs text-muted-foreground">{h.field_name ? `${h.field_name} · ` : ""}{t("送往", "to ")}{destLabel(h.destination, lang)} · {formatDate(h.harvest_date,settings)}{h.review_note ? ` · “${h.review_note}”` : ""}</div>
                  {me?.isManagement && <p className="mt-2 text-xs text-muted-foreground">{t("预计收入", "Expected revenue")}: {formatMoney(Number(h.expected_revenue),h.currency ?? undefined,lang)} · {t("成本", "Cost")}: {formatMoney(Number(h.cost),h.currency ?? undefined,lang)}</p>}
                  <Link to="/guide" search={{ harvest: h.id }} className="text-xs font-semibold text-primary underline">{t("问指导", "Ask the guide")}</Link>
                </div>
                <StatusBadge status={h.status} />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
