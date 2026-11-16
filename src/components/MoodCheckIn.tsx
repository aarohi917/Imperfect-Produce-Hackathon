import { Frown, Meh, Smile, SmilePlus, Heart } from "lucide-react";
import { useState } from "react";
import { useT, useLang } from "@/lib/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe, moodLabel } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const moodIcons = [Meh, Frown, Frown, Meh, Smile, SmilePlus];
const careZh = ["", "辛苦了。能休息就休息一下，和信任的人聊聊。", "低落的日子谁都会有，今天只做一件小事就好。", "平稳就好。", "很高兴听到。", "太好了，好好享受！"];
const careEn = ["", "That sounds hard. Rest if you can and talk to someone you trust.", "Low days happen. Just one small task today.", "Steady is good.", "Glad to hear it.", "Wonderful — enjoy it!"];

/** Private daily mood check-in; the guide reads recent entries to respond with care. */
export function MoodCheckIn() {
  const lang = useLang();
  const t = useT();
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [mood, setMood] = useState(0);
  const [note, setNote] = useState("");
  const { data: recent = [] } = useQuery({
    queryKey: ["reflections", me?.user.id], enabled: !!me,
    queryFn: async () => {
      if (!me) return [];
      return (await supabase.from("reflections").select("mood,created_at").eq("user_id", me.user.id).order("created_at", { ascending: false }).limit(7)).data ?? [];
    },
  });
  async function save() {
    if (!me) return;
    if (!mood) { toast.error(t("请选择您的心情。", "Pick how you feel.")); return; }
    const { error } = await supabase.from("reflections").insert({ user_id: me.user.id, mood, note });
    if (error) { toast.error(error.message); return; }
    toast.success(t(careZh[mood] ?? "", careEn[mood] ?? "")); setMood(0); setNote("");
    qc.invalidateQueries({ queryKey: ["reflections"] });
  }
  return (
    <section className="py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold">{t("今天心情如何？", "How are you today?")}</span>
        {[1, 2, 3, 4, 5].map((m) => (
          <Button variant="ghost" size="icon" key={m} title={moodLabel(lang)[m]} aria-label={moodLabel(lang)[m]} aria-pressed={mood === m} onClick={() => setMood(m)} className={`border-2 text-2xl ${mood === m ? "border-accent bg-accent/10" : "border-transparent"}`}>{(() => { const Icon = moodIcons[m] ?? Heart; return <Icon className="h-5 w-5" strokeWidth={1.5}/>; })()}</Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">{t("最近 7 次：", "Last 7: ")}{recent.length ? recent.map((r, i) => { const Icon = moodIcons[r.mood] ?? Meh; return <Icon key={i} className="inline h-4 w-4" aria-label={moodLabel(lang)[r.mood]} />; }).reverse() : "—"}</span>
      </div>
      {mood > 0 && (
        <div className="mt-3 flex gap-2">
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("价格、销路、天气或劳累，哪件事影响了您？（私人记录）", "Prices, buyers, weather or workload — what affected you? (private)")} />
          <Button onClick={save}>{t("保存", "Save")}</Button>
        </div>
      )}
    </section>
  );
}
