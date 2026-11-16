import { applyTheme, useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";
import { useState } from "react";
import { Settings as SettingsIcon, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSettings, useT, applySettings } from "@/lib/i18n";
import { CURRENCIES, LANGUAGES, languageNames, normalizeSettings, type Settings } from "@/lib/localization";
import { saveSettings } from "@/lib/settings.functions";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";

export function SettingsControl({localOnly=false}:{localOnly?:boolean}) {
  const theme = useTheme();
  const settings = useSettings(), t = useT(), save = useServerFn(saveSettings), qc = useQueryClient();
  const [open,setOpen] = useState(false), [busy,setBusy] = useState(false), [error,setError] = useState(false), [saved,setSaved] = useState(false);
  const [zones,setZones] = useState<string[]>(["UTC", "Asia/Shanghai", "Asia/Kolkata", "America/Los_Angeles", "America/New_York", "Europe/London", "Asia/Tokyo"]);
  async function update(patch: Partial<Settings>) {
    const next = normalizeSettings({...settings,...patch});
    setBusy(true); setError(false); setSaved(false);
    if(localOnly){applySettings(next);setSaved(true);setBusy(false);return;}
    try {
      const {data,error:authError} = await supabase.auth.getUser();
      if(authError && data.user) throw authError;
      if(data.user) {
        await save({data:next});
        qc.setQueryData(["user-settings",data.user.id],{language:next.language,currency:next.currency,time_zone:next.timeZone,week_starts_on:next.weekStartsOn,monitoring_enabled:next.monitoringEnabled,proactive_notifications:next.proactiveNotifications});
      }
      applySettings(next);
      await qc.invalidateQueries({queryKey:["farmer-assistant"]});
      setSaved(true);
    } catch { setError(true); } finally { setBusy(false); }
  }
  const selectClass = "mt-2 h-11 w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm";
  return <>
    <Button variant="ghost" size="icon" title={t("设置","Settings")} aria-label={t("设置","Settings")} onClick={() => {setOpen(true); const intl = Intl as typeof Intl & {supportedValuesOf?: (key:string)=>string[]}; setZones([...new Set(["UTC",settings.timeZone,...(intl.supportedValuesOf?.("timeZone") ?? zones)])].sort());}}><SettingsIcon className="h-5 w-5"/></Button>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-xl"><DialogHeader><DialogTitle>{t("设置","Settings")}</DialogTitle><DialogDescription className="sr-only">{t("语言、货币和时区","Language, currency and time zone","भाषा, मुद्रा और समय क्षेत्र","भाषा, चलन आणि वेळ क्षेत्र")}</DialogDescription></DialogHeader>
      <div className="space-y-6">
        <fieldset><legend className="text-sm font-medium">{t("外观","Appearance","दिखावट","स्वरूप")}</legend><div className="mt-2 grid grid-cols-2 gap-2"><Button variant={theme === "light" ? "secondary" : "outline"} aria-pressed={theme === "light"} onClick={() => applyTheme("light")}><Sun/>{t("浅色","Light","हल्का","फिकट")}</Button><Button variant={theme === "dark" ? "secondary" : "outline"} aria-pressed={theme === "dark"} onClick={() => applyTheme("dark")}><Moon/>{t("深色","Dark","गहरा","गडद")}</Button></div></fieldset>
        <section className="grid gap-5 border-y border-border py-5 sm:grid-cols-2"><div><Label htmlFor="settings-language">{t("语言","Language")}</Label><select id="settings-language" className={selectClass} value={settings.language} disabled={busy} onChange={e=>void update({language:LANGUAGES.find(l=>l===e.target.value) ?? settings.language})}>{LANGUAGES.map(l=><option key={l} value={l} lang={l}>{languageNames[l]}</option>)}</select></div>
        <div><Label htmlFor="settings-currency">{t("货币","Currency")}</Label><select id="settings-currency" className={selectClass} value={settings.currency} disabled={busy} onChange={e=>void update({currency:CURRENCIES.find(c=>c===e.target.value) ?? settings.currency})}>{CURRENCIES.map(c=><option key={c} value={c}>{new Intl.DisplayNames([settings.language],{type:"currency"}).of(c)} · {c}</option>)}</select></div>
        <div className="sm:col-span-2"><Label htmlFor="settings-time-zone">{t("时区","Time zone")}</Label><select id="settings-time-zone" className={selectClass} value={settings.timeZone} disabled={busy} onChange={e=>void update({timeZone:e.target.value})}>{zones.map(zone=><option key={zone} value={zone}>{zone.replaceAll("_"," ")}</option>)}</select></div>
        </section><section className="space-y-4"><div><Label htmlFor="settings-week-start">{t("每周开始于","Week starts on","सप्ताह की शुरुआत","आठवड्याची सुरुवात")}</Label><select id="settings-week-start" className={selectClass} value={settings.weekStartsOn ?? "monday"} disabled={busy} onChange={e=>void update({weekStartsOn:e.target.value === "sunday" ? "sunday" : "monday"})}><option value="sunday">{t("星期日","Sunday","रविवार","रविवार")}</option><option value="monday">{t("星期一","Monday","सोमवार","सोमवार")}</option></select></div>
        <div className="flex min-h-11 items-center justify-between gap-4 [&_label]:leading-relaxed [&_button]:shrink-0"><Label htmlFor="settings-monitoring">{t("自动农场监测","Automatic farm monitoring","स्वचालित खेत निगरानी","स्वयंचलित शेत निरीक्षण")}</Label><Switch id="settings-monitoring" checked={settings.monitoringEnabled ?? true} disabled={busy} onCheckedChange={monitoringEnabled=>void update({monitoringEnabled})}/></div>
        <div className="flex min-h-11 items-center justify-between gap-4 [&_label]:leading-relaxed [&_button]:shrink-0"><Label htmlFor="settings-alerts">{t("主动通知","Proactive notifications","सक्रिय सूचनाएँ","सक्रिय सूचना")}</Label><Switch id="settings-alerts" checked={settings.proactiveNotifications ?? true} disabled={busy} onCheckedChange={proactiveNotifications=>void update({proactiveNotifications})}/></div>
        </section>
        <div className="min-h-5" aria-live="polite">
        {error && <p role="alert" className="text-sm text-destructive">{t("无法保存设置。","Could not save settings.")}</p>}
        {saved && <p role="status" className="flex items-center gap-2 text-sm text-primary"><Check className="h-4 w-4"/>{t("已保存","Saved")}</p>}
        </div>
      </div>
      <DialogFooter className="border-t border-border pt-4"><Button variant="outline" onClick={()=>setOpen(false)}>{t("关闭","Close","बंद करें","बंद करा")}</Button></DialogFooter>
    </DialogContent></Dialog>
  </>;
}