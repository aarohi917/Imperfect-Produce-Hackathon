import { formatMoney, formatDate } from "@/lib/localization";
import { findingLabel } from "@/lib/finding-label";
import { useState } from "react";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Target, Leaf, Plus, Pencil, Trash2 } from "lucide-react";
import { loadFarmerAssistant, saveFarmerMemory, deleteFarmerMemory, setFarmerRecall, saveFarmerGoal, deleteFarmerGoal } from "@/lib/farmer-assistant.functions";
import { useT, useLang, useSettings } from "@/lib/i18n";
import { vegLabel } from "@/lib/vegetables";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import type { GoalMetric } from "@/lib/farmer-assistant";

export const farmerAssistantQuery = queryOptions({queryKey:["farmer-assistant"],queryFn:()=>loadFarmerAssistant(),staleTime:0});
type GoalDraft = {id?:string;title:string;metric:GoalMetric;target:string;dueDate:string;crop:string;measurement:string;currentValue:string;status:"active"|"paused"};
const blankGoal: GoalDraft = {title:"",metric:"margin",target:"",dueDate:"",crop:"all",measurement:"",currentValue:"",status:"active"};
export function FarmerAssistantPanel({onDiscuss}:{onDiscuss:(options:{harvestId?:string;goalId?:string})=>Promise<void>}) {
  const t=useT(),lang=useLang(),settings=useSettings(),qc=useQueryClient();
  const {data}=useSuspenseQuery(farmerAssistantQuery);
  const saveMemory=useServerFn(saveFarmerMemory),removeMemory=useServerFn(deleteFarmerMemory),recall=useServerFn(setFarmerRecall),saveGoal=useServerFn(saveFarmerGoal),removeGoal=useServerFn(deleteFarmerGoal);
  const [section,setSection]=useState<"memory"|"goals"|"findings">("goals");
  const [memory,setMemory]=useState<{id?:string;content:string}|null>(null);
  const [goal,setGoal]=useState<GoalDraft|null>(null);
  const [deleting,setDeleting]=useState<{type:"memory"|"goal";id:string}|null>(null);
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function act(action:()=>Promise<unknown>){
    setBusy(true);setError("");
    try{await action();await qc.invalidateQueries({queryKey:["farmer-assistant"]});return true;}
    catch(e){setError(t("暂时无法保存","Could not save"));return false;}
    finally{setBusy(false);}
  }
  const number=(value:number|null)=>value===null?t("暂无测量","Not measured"):value.toFixed(2);
  return <section className="mt-4 border-y border-border py-3" aria-label={t("我的农场伙伴","My farm companion")}>
    <div className="flex flex-wrap gap-1">
      {([{key:"findings",icon:Leaf,label:t("值得留意", "Worth checking"),count:data.findings.length},{key:"goals",icon:Target,label:t("我的目标","My goals"),count:data.goals.length},{key:"memory",icon:Brain,label:t("农场记忆","Farm memory"),count:data.memories.length}] as const).map(item=><Button key={item.key} size="sm" variant={section===item.key?"secondary":"ghost"} aria-pressed={section===item.key} onClick={()=>setSection(item.key)}><item.icon/>{item.label}{item.count>0?` (${item.count})`:""}</Button>)}
    </div>
    {error && <p role="alert" className="mt-2 text-sm text-destructive">{error}</p>}
    {section==="findings" && <div className="mt-3 space-y-3">
      {!data.findings.length && <p className="text-sm text-muted-foreground">{t("现有记录中未发现符合条件的提醒；不代表没有风险。","No qualifying patterns found in available records; this does not mean there is no risk.")}</p>}
      {data.findings.map(f=><article key={f.key} className="border-l-2 border-primary pl-3"><p className="text-sm font-semibold">{findingLabel(f,lang,settings.currency)}</p><p className="mt-1 text-sm text-muted-foreground">{findingLabel(f,lang,settings.currency,true)}</p><Button variant="link" size="sm" className="px-0" disabled={busy} onClick={()=>act(()=>onDiscuss(f.ids[0] ? {harvestId:f.ids[0]} : {}))}>{t("一起看看","Discuss with the guide")}</Button></article>)}
      <p className="text-xs text-muted-foreground">{t("尚未记录已售/未售重量、买方扣款或实收款，不能据此判断滞销或实际利润。","Sold/unsold weights, buyer deductions and payments are not recorded; unsold produce and actual profit cannot be established.")}</p>
    </div>}
    {section==="memory" && <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between gap-3"><Label htmlFor="recall-history">{t("参考以前的对话","Use earlier conversations")}</Label><Switch id="recall-history" checked={data.recallEnabled} disabled={busy} onCheckedChange={enabled=>act(()=>recall({data:{enabled}}))}/></div>
      <p className="text-xs text-muted-foreground">{t("对话仅供您本人使用。开启后参考最近500条中的最多20条相关或近期自述；删除对话即可移除该来源。下方是您确认保存的长期信息。","Conversations remain private. When enabled, up to 20 relevant or recent statements from the latest 500 provide context; deleting a conversation removes that source. Confirmed long-term notes appear below.")}</p>
      {data.memories.map(m=><div key={m.id} className="flex items-start justify-between gap-2 border-b border-border pb-2"><p className="whitespace-pre-wrap break-words text-sm [overflow-wrap:anywhere]">{m.content}</p><div className="flex shrink-0"><Button variant="ghost" size="icon-sm" aria-label={t("编辑记忆","Edit memory")} title={t("编辑记忆","Edit memory")} onClick={()=>setMemory({id:m.id,content:m.content})}><Pencil/></Button><Button variant="ghost" size="icon-sm" aria-label={t("删除记忆","Delete memory")} title={t("删除记忆","Delete memory")} onClick={()=>setDeleting({type:"memory",id:m.id})}><Trash2/></Button></div></div>)}
      <Button variant="outline" size="sm" onClick={()=>setMemory({content:""})}><Plus/>{t("添加农场信息","Add farm information")}</Button>
    </div>}
    {section==="goals" && <div className="mt-3 space-y-3">
      <Button variant="outline" size="sm" onClick={()=>setGoal({...blankGoal,metric:data.management?"margin":"custom"})}><Plus/>{t("设定目标","Set a goal")}</Button>
      {!data.goals.length && <p className="text-sm text-muted-foreground">{t("您目前没有保存的目标。","You have no saved goals yet.")}</p>}
      {data.goals.map(g=>{const unit=g.metric==="expected_profit"?g.currency:g.metric==="margin"?"%":g.metric==="cost_per_kg"?`${g.currency}/${t("公斤","kg")}`:g.measurement;return <article key={g.id} className="border-b border-border pb-3">
        <div className="flex items-start justify-between gap-2"><h3 className="min-w-0 break-words font-bold">{g.title}</h3><div className="flex shrink-0"><Button variant="ghost" size="icon-sm" title={t("编辑目标","Edit goal")} aria-label={t("编辑目标","Edit goal")} onClick={()=>setGoal({id:g.id,title:g.title,metric:g.metric as GoalMetric,target:String(g.target),dueDate:g.due_date,crop:g.crop??"all",measurement:g.measurement,currentValue:g.current_value===null?"":String(g.current_value),status:g.status==="paused"?"paused":"active"})}><Pencil/></Button><Button variant="ghost" size="icon-sm" title={t("删除目标","Delete goal")} aria-label={t("删除目标","Delete goal")} onClick={()=>setDeleting({type:"goal",id:g.id})}><Trash2/></Button></div></div>
        <p className="text-xs text-muted-foreground">{g.crop?vegLabel(g.crop,lang):t("全部作物","All crops")} · {t("截至","Due")} {formatDate(g.due_date,settings)}{g.status==="paused"?t(" · 已暂停"," · Paused"):""}</p>
        <div className="mt-2 grid grid-cols-1 gap-1 text-sm sm:grid-cols-3"><p>{t("起点","Baseline")}: {g.metric==="cost_per_kg" && g.baseline!==null?formatMoney(g.baseline,g.currency,lang,2):number(g.baseline)} {unit}</p><p>{t("当前","Current")}: {g.metric==="cost_per_kg" && g.current!==null?formatMoney(g.current,g.currency,lang,2):number(g.current)} {unit}</p><p>{t("目标","Target")}: {g.metric==="cost_per_kg"?formatMoney(g.target,g.currency,lang,2):g.target} {unit}</p></div>
        <p className="mt-1 text-xs text-muted-foreground">{g.metric==="custom"?t("数值由您填写，尚未经独立核实。","Values are self-reported, not independently verified."):t(`起点为设定前30天；当前为${formatDate(g.baseline_date,settings)}起的已核对采收。预计金额不是实收款。`,`Baseline covers the preceding 30 days; current values use checked harvests from ${formatDate(g.baseline_date,settings)}. Expected money is not payments received.`,`शुरुआती मान पिछले 30 दिनों का है; वर्तमान मान ${formatDate(g.baseline_date,settings)} से जाँची गई कटाई का है। अनुमानित आय प्राप्त भुगतान नहीं है।`,`प्रारंभिक मूल्य मागील ३० दिवसांचे आहे; सध्याचे मूल्य ${formatDate(g.baseline_date,settings)} पासून पडताळलेल्या कापणीचे आहे. अपेक्षित उत्पन्न म्हणजे मिळालेले पैसे नाहीत.`)}</p>
        <p className="mt-1 text-xs text-muted-foreground">{g.assessment === "behind" ? t("期限已过，记录数值仍未达到目标。","The deadline has passed and recorded values remain below target.","समय सीमा बीत गई; दर्ज मान लक्ष्य से नीचे हैं।","मुदत संपली; नोंदवलेली मूल्ये लक्ष्यापेक्षा कमी आहेत.") : g.assessment === "not_yet_assessable" ? t("尚未达到目标；现有记录不足以预测能否按期达成。","Target not yet met; records cannot establish whether you are on track.","लक्ष्य अभी नहीं मिला; रिकॉर्ड समय पर पहुँचने का अनुमान नहीं दे सकते।","लक्ष्य अजून गाठले नाही; नोंदींवरून वेळेत पोहोचण्याचा अंदाज करता येत नाही.") : ""}</p>
        {g.targetObserved && <p className="mt-1 text-sm text-primary">{t("现有数值达到目标；请核实记录，尚未认定目标完成。","Available values meet the target; verify records. Completion is not assumed.")}</p>}
        <Button variant="link" size="sm" className="px-0" disabled={busy} onClick={()=>act(()=>onDiscuss({goalId:g.id}))}>{t("制定或更新计划","Create or revisit the plan")}</Button>
      </article>;})}
    </div>}
    <Dialog open={!!memory} onOpenChange={v=>{if(!v && !busy)setMemory(null);}}><DialogContent><DialogHeader><DialogTitle>{t("确认农场记忆","Confirm farm memory")}</DialogTitle></DialogHeader><Label htmlFor="farm-memory">{t("希望伙伴记住什么？","What should the guide remember?")}</Label><Textarea id="farm-memory" value={memory?.content??""} maxLength={1000} onChange={e=>setMemory(m=>m?{...m,content:e.target.value}:m)} placeholder={t("例如：我想减少运输成本。","For example: I want to reduce transport costs.")}/>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button variant="outline" disabled={busy} onClick={()=>setMemory(null)}>{t("取消","Cancel")}</Button><Button disabled={busy||!memory?.content.trim()} onClick={async()=>{if(memory && await act(()=>saveMemory({data:memory})))setMemory(null);}}>{t("确认保存","Confirm and save")}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={!!goal} onOpenChange={v=>{if(!v&&!busy)setGoal(null);}}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>{t("我的农业目标","My farming goal")}</DialogTitle></DialogHeader>
      {goal && <form className="space-y-3" onSubmit={async e=>{e.preventDefault();if(await act(()=>saveGoal({data:{...goal,target:Number(goal.target),crop:goal.crop==="all"?null:goal.crop,currentValue:goal.currentValue===""?null:Number(goal.currentValue)}})))setGoal(null);}}>
        <div><Label htmlFor="goal-title">{t("想改善什么？","What do you want to improve?")}</Label><Input id="goal-title" required maxLength={200} value={goal.title} onChange={e=>setGoal({...goal,title:e.target.value})}/></div>
        <div><Label>{t("衡量指标","Measure")}</Label><Select value={goal.metric} disabled={!!goal.id} onValueChange={v=>setGoal({...goal,metric:v as GoalMetric})}><SelectTrigger aria-label={t("衡量指标","Measure")}><SelectValue/></SelectTrigger><SelectContent>{data.management && <><SelectItem value="margin">{t("预计毛利率 (%)","Expected margin (%)")}</SelectItem><SelectItem value="cost_per_kg">{`${t("成本/公斤","Cost/kg")} (${settings.currency})`}</SelectItem><SelectItem value="expected_profit">{t("预计毛利金额","Expected gross profit amount","अनुमानित सकल लाभ राशि","अपेक्षित एकूण नफा रक्कम")}</SelectItem></>}<SelectItem value="custom">{t("其他（自己记录）","Other (self-reported)")}</SelectItem></SelectContent></Select></div>
        <div><Label>{t("作物","Crop")}</Label><Select value={goal.crop} disabled={!!goal.id} onValueChange={v=>setGoal({...goal,crop:v})}><SelectTrigger aria-label={t("目标作物","Goal crop")}><SelectValue/></SelectTrigger><SelectContent><SelectItem value="all">{t("全部作物","All crops")}</SelectItem>{data.crops.map(c=><SelectItem key={c} value={c}>{vegLabel(c,lang)}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="goal-target">{t("目标数值","Target value")}</Label><Input id="goal-target" type="number" step="any" required value={goal.target} onChange={e=>setGoal({...goal,target:e.target.value})}/></div><div><Label htmlFor="goal-date">{t("目标日期","Target date")}</Label><Input id="goal-date" type="date" required value={goal.dueDate} onChange={e=>setGoal({...goal,dueDate:e.target.value})}/></div></div>
        {goal.metric==="custom" && <><div><Label htmlFor="goal-measurement">{t("单位和记录方法","Unit and measurement method")}</Label><Input id="goal-measurement" required maxLength={500} value={goal.measurement} onChange={e=>setGoal({...goal,measurement:e.target.value})}/></div><div><Label htmlFor="goal-current">{t("当前自述数值（可不填）","Current self-reported value (optional)")}</Label><Input id="goal-current" type="number" step="any" value={goal.currentValue} onChange={e=>setGoal({...goal,currentValue:e.target.value})}/></div></>}
        <div className="flex items-center justify-between"><Label htmlFor="goal-paused">{t("暂停目标","Pause goal")}</Label><Switch id="goal-paused" checked={goal.status==="paused"} onCheckedChange={v=>setGoal({...goal,status:v?"paused":"active"})}/></div>
        {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" disabled={busy} onClick={()=>setGoal(null)}>{t("取消","Cancel")}</Button><Button type="submit" disabled={busy}>{t("确认保存","Confirm and save")}</Button></DialogFooter>
      </form>}
    </DialogContent></Dialog>
    <Dialog open={!!deleting} onOpenChange={v=>{if(!v&&!busy)setDeleting(null);}}><DialogContent><DialogHeader><DialogTitle>{t("确认删除？","Confirm deletion?")}</DialogTitle></DialogHeader><p className="text-sm">{t("此项将永久删除；原采收记录不会改变。","This item will be permanently deleted; harvest records stay unchanged.")}</p><DialogFooter><Button variant="outline" disabled={busy} onClick={()=>setDeleting(null)}>{t("取消","Cancel")}</Button><Button variant="destructive" disabled={busy} onClick={async()=>{if(deleting && await act(()=>deleting.type==="memory"?removeMemory({data:{id:deleting.id}}):removeGoal({data:{id:deleting.id}})))setDeleting(null);}}>{t("删除","Delete")}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}