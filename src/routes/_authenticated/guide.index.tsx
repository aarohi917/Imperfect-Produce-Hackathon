import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { createGuideThread } from "@/lib/guide-history.functions";
import { Button } from "@/components/ui/button";
import { pageMeta } from "@/lib/page-meta";
import { useT } from "@/lib/i18n";
import { ReferencePhoto } from "@/components/ReferencePhoto";
export const Route = createFileRoute("/_authenticated/guide/")({
  head: () =>
    pageMeta(
      "聊天记录 — 丑蔬 Imperfect Produce",
      "查看和继续田间伙伴的私人聊天记录，或开始新的农业指导对话。",
    ),
  component: Welcome,
});
function Welcome() {
  const t = useT();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const create = useServerFn(createGuideThread);
  const { harvest } = Route.useSearch();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);
  async function start() {
    setFailed(false);
    try {
      const thread = await create({ data: { harvestId: harvest ?? null } });
      await qc.invalidateQueries({ queryKey: ["guide-threads"] });
      await navigate({ to: "/guide/$threadId", params: { threadId: thread.id }, search: { harvest: undefined }, replace: true });
    } catch {
      setFailed(true);
    }
  }
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void start();
  }, []);
  return (
    <div className="flex min-h-60 flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <ReferencePhoto className="h-40 w-full max-w-sm" />
      <h2 className="text-2xl">{t("田间伙伴", "Field Friend")}</h2>
      <p className="text-muted-foreground">{t("今天想聊些什么？", "What's on your mind today?")}</p>
      {failed ? <><p role="alert" className="text-sm text-destructive">{t("无法创建对话，请重试。", "Could not create conversation. Please try again.")}</p><Button onClick={() => void start()}>{t("重试", "Try again")}</Button></> : <p role="status" className="text-sm text-muted-foreground">{t("正在打开新对话…", "Opening a new conversation…")}</p>}
    </div>
  );
}
