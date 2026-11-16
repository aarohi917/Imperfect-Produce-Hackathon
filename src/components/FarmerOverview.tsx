import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { loadOperations } from "@/lib/operations.functions";
import { loadCommunication } from "@/lib/communication.functions";
import { useT, useSettings } from "@/lib/i18n";
import { vegLabel, destLabel } from "@/lib/vegetables";
import { formatDate } from "@/lib/localization";
import { ReferencePhoto } from "./ReferencePhoto";
import { StatusBadge } from "./StatusBadge";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Camera, ScanLine, ArrowUpRight, Sprout, SlidersHorizontal, Ship, List, LayoutGrid, ArrowRight, X } from "lucide-react";
export const operationsQuery=queryOptions({queryKey:["operations"],queryFn:()=>loadOperations()});
export const shipmentsQuery=queryOptions({queryKey:["operational-shipments"],queryFn:()=>loadCommunication({data:{}})});
export function FarmerOverview(){
  const t=useT(),settings=useSettings();
  const {data:rows}=useSuspenseQuery(operationsQuery);
  const {data:communication}=useSuspenseQuery(shipmentsQuery);
  const [crop,setCrop]=useState("all"),[status,setStatus]=useState("all");
  const [photos,setPhotos]=useState(true),[grid,setGrid]=useState(false);
  const [direction,setDirection]=useState("all");
  const confirmed=rows.filter(r=>r.status==="approved");
  const crops=[...new Set(rows.map(r=>r.vegetable))];
  const filtered=rows.filter(r=>(crop==="all"||r.vegetable===crop)&&(status==="all"||r.status===status));
  const shipments=communication.requests.filter(r=>direction==="all"||r.direction===direction);
  const statuses=[{value:"all",label:t("全部","All","सभी","सर्व")},{value:"pending",label:t("等待核对","Awaiting review","समीक्षा लंबित","पडताळणी बाकी")},{value:"approved",label:t("已批准","Approved","स्वीकृत","मंजूर")},{value:"rejected",label:t("已驳回","Rejected","अस्वीकृत","नामंजूर")}];
  return <>
    <div className="grid items-start gap-6 border-b border-border pb-6 md:grid-cols-[1fr_300px]">
      <div><h1 className="text-4xl">{t("农场概览","Farm overview","खेत का अवलोकन","शेताचा आढावा")}</h1>
      <div className="my-6 grid grid-cols-3 gap-4">{[[t("已核对重量","Confirmed kg","जाँचा वजन","पडताळलेले किलो"),confirmed.reduce((a,r)=>a+r.quantity,0).toFixed(1)],[t("等待核对","Awaiting review","समीक्षा लंबित","पडताळणी बाकी"),rows.filter(r=>r.status==="pending").length],[t("作物","Crops","फसलें","पिके"),new Set(confirmed.map(r=>r.vegetable)).size]].map(([label,value])=><div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-sans text-2xl font-semibold tabular-nums">{value}</p></div>)}</div>
      <div className="flex flex-wrap gap-2"><Button asChild><Link to="/harvest"><Camera/>{t("上报采收","Report a harvest","कटाई दर्ज करें","कापणी नोंदवा")}</Link></Button><Button asChild variant="outline"><Link to="/visual-intelligence"><ScanLine/>{t("查看蔬菜","Check produce","उपज जाँचें","उत्पादन तपासा")}</Link></Button></div></div>
      <ReferencePhoto crop={crop==="all"?"":crop} className="h-48 w-full"/>
    </div>
    {crops.length>0 && <section className="border-b border-border py-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl">{t("田间作物","In the field","खेत की फसलें","शेतातील पिके")}</h2>{crop!=="all"&&<Button variant="ghost" size="sm" onClick={()=>setCrop("all")}><X/>{t("全部作物","All crops","सभी फसलें","सर्व पिके")}</Button>}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">{crops.map(c=>{const kg=confirmed.filter(r=>r.vegetable===c).reduce((a,r)=>a+r.quantity,0);return <Button key={c} variant="ghost" aria-pressed={crop===c} onClick={()=>setCrop(crop===c?"all":c)} className={`group h-auto flex-col items-stretch gap-0 overflow-hidden rounded-sm border p-0 text-left ${crop===c?"border-primary bg-secondary":"border-border"}`}><ReferencePhoto crop={c} className="h-24 w-full"/><span className="flex items-center justify-between gap-2 px-3 pt-3 font-semibold">{vegLabel(c,settings.language)}<ArrowUpRight className="h-3 w-3 shrink-0"/></span><span className="px-3 pb-3 pt-1 text-xs font-normal text-muted-foreground">{kg.toFixed(1)} kg · {t("已批准","Approved","स्वीकृत","मंजूर")}</span></Button>;})}</div>
    </section>}
    <div className="grid gap-8 pt-7 lg:grid-cols-[1.2fr_1fr]"><section className="min-w-0"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl">{t("近期采收","Recent harvests","हाल की कटाई","अलीकडील कापणी")}</h2><div className="flex gap-1"><Button size="icon-sm" variant={grid?"ghost":"secondary"} aria-label={t("列表视图","List view","सूची दृश्य","यादी दृश्य")} title={t("列表视图","List view","सूची दृश्य","यादी दृश्य")} aria-pressed={!grid} onClick={()=>setGrid(false)}><List/></Button><Button size="icon-sm" variant={grid?"secondary":"ghost"} aria-label={t("网格视图","Grid view","ग्रिड दृश्य","ग्रिड दृश्य")} title={t("网格视图","Grid view","ग्रिड दृश्य","ग्रिड दृश्य")} aria-pressed={grid} onClick={()=>setGrid(true)}><LayoutGrid/></Button></div></div>
      <div className="mb-4 flex flex-wrap items-center gap-2 border-y border-border py-3"><SlidersHorizontal className="h-4 w-4 text-muted-foreground"/><Select value={crop} onValueChange={setCrop}><SelectTrigger className="w-36" aria-label={t("作物筛选","Filter crop","फसल छाँटें","पीक निवडा")}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{t("全部作物","All crops","सभी फसलें","सर्व पिके")}</SelectItem>{crops.map(c=><SelectItem key={c} value={c}>{vegLabel(c,settings.language)}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40" aria-label={t("审核状态","Review status","समीक्षा स्थिति","पडताळणी स्थिती")}><SelectValue/></SelectTrigger><SelectContent>{statuses.map(s=><SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select><label className="ml-auto flex cursor-pointer items-center gap-2 text-xs"><Switch checked={photos} onCheckedChange={setPhotos} aria-label={t("显示照片","Show photos","फोटो दिखाएँ","फोटो दाखवा")}/>{t("照片","Photos","फोटो","फोटो")}</label></div>
      {!filtered.length&&<div className="border-b border-border py-10 text-sm text-muted-foreground">{t("没有符合筛选条件的采收记录。","No harvests match these filters.","इन फ़िल्टर से कोई कटाई नहीं मिली।","या निवडीशी जुळणारी कापणी नाही.")}</div>}
      <div className={grid?"grid grid-cols-1 gap-3 sm:grid-cols-2":""}>{filtered.slice(0,12).map(r=><article key={r.id} className={grid?"overflow-hidden rounded-sm border border-border":"flex items-start gap-3 border-b border-border py-4"}>{photos&&<ReferencePhoto crop={r.vegetable} className={grid?"h-36 w-full":"h-20 w-20 shrink-0"}/>}<div className={`min-w-0 flex-1 ${grid?"p-4":""}`}><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="font-sans font-semibold">{vegLabel(r.vegetable,settings.language)} · {r.quantity} kg</h3><StatusBadge status={r.status}/></div><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{formatDate(r.harvest_date,settings)} · {r.field_name||"—"} · {r.grade} · {destLabel(r.destination,settings.language)}</p><Button asChild variant="link" size="sm" className="mt-1 h-7 px-0 text-xs"><Link to="/guide" search={{harvest:r.id}}>{t("问指导","Ask the guide","मार्गदर्शन पूछें","मार्गदर्शकाला विचारा")}<ArrowRight className="h-3 w-3"/></Link></Button></div></article>)}</div>
    </section>
    <section className="min-w-0 border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pl-7 lg:pt-0"><div className="mb-4 flex items-center gap-2"><Ship className="h-5 w-5 text-primary"/><h2 className="text-2xl">{t("进出口动态","Import & export updates","आयात और निर्यात अपडेट","आयात आणि निर्यात अपडेट")}</h2></div><div className="mb-4 flex flex-wrap gap-1">{[{value:"all",label:t("全部","All","सभी","सर्व")},{value:"import",label:t("进口","Imports","आयात","आयात")},{value:"export",label:t("出口","Exports","निर्यात","निर्यात")}].map(d=><Button key={d.value} variant={direction===d.value?"secondary":"ghost"} size="sm" aria-pressed={direction===d.value} onClick={()=>setDirection(d.value)}>{d.label}</Button>)}</div>
    {!shipments.length&&<div className="border-y border-border py-6"><p className="text-sm text-muted-foreground">{t("暂无符合条件的进出口申请。","No matching import or export requests.","कोई मिलते आयात या निर्यात अनुरोध नहीं।","जुळणाऱ्या आयात किंवा निर्यात विनंत्या नाहीत.")}</p></div>}{shipments.slice(0,10).map(r=><article key={r.id} className="border-b border-border py-4"><p className="text-xs text-primary">{r.direction==="import"?t("进口","Import","आयात","आयात"):t("出口","Export","निर्यात","निर्यात")}</p><h3 className="mt-1 font-sans font-semibold">{vegLabel(r.vegetable,settings.language)} · {r.quantity} kg</h3><p className="my-2 text-sm">{r.origin} → {r.destination}</p><StatusBadge status={r.status}/></article>)}<Button asChild variant="outline" size="sm" className="mt-4"><Link to="/requests">{t("进出口申请","Import-export requests","आयात-निर्यात अनुरोध","आयात-निर्यात विनंत्या")}<ArrowUpRight/></Link></Button>
    </section></div>
  </>;
}
