import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Plus, Pencil, Trash2, History, Check, X } from "lucide-react";
import {
  listGuideThreads,
  createGuideThread,
  renameGuideThread,
  deleteGuideThread,
} from "@/lib/guide-history.functions";
import { useT, useSettings } from "@/lib/i18n";
import { displayChatTitle } from "@/lib/guide-history";
import { MoodCheckIn } from "@/components/MoodCheckIn";
import { FarmerAssistantPanel, farmerAssistantQuery } from "@/components/FarmerAssistantPanel";
import { EvidenceNotes } from "@/components/EvidenceNotes";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { pageMeta } from "@/lib/page-meta";
import { GuideContext } from "@/components/GuideContext";
export const guideThreadsQuery = queryOptions({
  queryKey: ["guide-threads"],
  queryFn: () => listGuideThreads(),
  staleTime: 0,
});
export const Route = createFileRoute("/_authenticated/guide")({
  head: () =>
    pageMeta(
      "农户指导 — 丑蔬 Imperfect Produce",
      "结合已核对采收、自述感受及有出处的研究提供有机种植指导，并保存私人对话。",
    ),
  validateSearch: (s: Record<string, unknown>) => ({
    harvest: typeof s["harvest"] === "string" ? s["harvest"] : undefined,
  }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(guideThreadsQuery), context.queryClient.ensureQueryData(farmerAssistantQuery)]),
  component: Guide,
});
function Guide() {
  const settings = useSettings();
  const t = useT(),
    navigate = useNavigate(),
    qc = useQueryClient();
  const { data: threads } = useSuspenseQuery(guideThreadsQuery);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { harvest } = Route.useSearch();
  const create = useServerFn(createGuideThread),
    rename = useServerFn(renameGuideThread),
    remove = useServerFn(deleteGuideThread);
  const [open, setOpen] = useState(false),
    [working, setWorking] = useState(false),
    [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null),
    [title, setTitle] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  async function newChat(options?: {harvestId?:string;goalId?:string}) {
    setWorking(true);
    setError("");
    try {
      const thread = await create({ data: { harvestId: options?.harvestId ?? harvest ?? null, goalId: options?.goalId } });
      await qc.invalidateQueries({ queryKey: ["guide-threads"] });
      await navigate({
        to: "/guide/$threadId",
        params: { threadId: thread.id },
        search: { harvest: undefined },
      });
      setOpen(false);
    } catch (e) {
      setError(t("无法创建对话，请重试。","Could not create conversation. Please try again.","बातचीत नहीं बनी। फिर कोशिश करें।","संभाषण तयार झाले नाही. पुन्हा प्रयत्न करा."));
    } finally {
      setWorking(false);
    }
  }
  async function saveTitle(threadId: string) {
    setWorking(true);
    setError("");
    try {
      await rename({ data: { threadId, title } });
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ["guide-threads"] });
    } catch (e) {
      setError(t("无法重命名，请重试。","Could not rename. Please try again.","नाम नहीं बदला। फिर कोशिश करें।","नाव बदलता आले नाही. पुन्हा प्रयत्न करा."));
    } finally {
      setWorking(false);
    }
  }
  async function deleteChat() {
    if (!deleting) return;
    setWorking(true);
    setError("");
    try {
      await remove({ data: { threadId: deleting } });
      qc.removeQueries({ queryKey: ["guide-thread", deleting] });
      if (path === `/guide/${deleting}`)
        await navigate({ to: "/guide", search: { harvest: undefined } });
      setDeleting(null);
      await qc.invalidateQueries({ queryKey: ["guide-threads"] });
    } catch (e) {
      setError(t("无法删除，请重试。","Could not delete. Please try again.","हटाया नहीं गया। फिर कोशिश करें।","हटवता आले नाही. पुन्हा प्रयत्न करा."));
    } finally {
      setWorking(false);
    }
  }
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 [&_h1]:mb-0 [&>div:first-child]:mb-0">
      <PageTitle title={t("农户指导", "Farmer's guide")} />
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setOpen(!open)} aria-expanded={open}>
          <History />
          {t("聊天记录", "Chat history")}
        </Button>
        <Button size="sm" disabled={working} onClick={() => newChat()}>
          <Plus />
          {t("新对话", "New conversation")}
        </Button>
      </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="guide-workspace flex min-w-0 flex-col border-y border-border bg-card xl:flex-row">
        <aside
          aria-label={t("聊天记录", "Chat history")}
          className={`${open ? "block" : "hidden"} max-h-64 shrink-0 overflow-y-auto border-b border-border bg-muted/30 p-4 xl:max-h-none xl:w-56 xl:border-r xl:border-b-0`}
        >
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
            <History className="h-4 w-4" />
            {t("聊天记录", "Chat history")}
          </h2>
          {!threads.length && (
            <p className="text-sm text-muted-foreground">{t("暂无对话", "No conversations yet")}</p>
          )}
          {threads.map((thread) => (
            <div
              key={thread.id}
              className={`mb-1 rounded-md p-2 ${path === `/guide/${thread.id}` ? "bg-secondary" : "hover:bg-muted"}`}
            >
              {editing === thread.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveTitle(thread.id);
                  }}
                >
                  <Input
                    autoFocus
                    aria-label={t("对话标题", "Conversation title")}
                    value={title}
                    maxLength={180}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                  <div className="mt-1 flex justify-end">
                    <Button
                      type="submit"
                      size="icon-sm"
                      variant="ghost"
                      disabled={working || !title.trim()}
                      title={t("保存标题", "Save title")}
                      aria-label={t("保存标题", "Save title")}
                    >
                      <Check />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setEditing(null)}
                      aria-label={t("取消", "Cancel")}
                    >
                      <X />
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <Link
                    to="/guide/$threadId"
                    params={{ threadId: thread.id }}
                    search={{ harvest: undefined }}
                    onClick={() => setOpen(false)}
                    className="block break-words text-sm leading-relaxed [overflow-wrap:anywhere]"
                    aria-current={path === `/guide/${thread.id}` ? "page" : undefined}
                  >
                    {displayChatTitle(thread,settings.language,settings.timeZone)}
                  </Link>
                  <div className="mt-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={working}
                      title={t("重命名对话", "Rename conversation")}
                      aria-label={t("重命名对话", "Rename conversation")}
                      onClick={() => {
                        setEditing(thread.id);
                        setTitle(displayChatTitle(thread,settings.language,settings.timeZone));
                      }}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={working}
                      title={t("删除对话", "Delete conversation")}
                      aria-label={t("删除对话", "Delete conversation")}
                      onClick={() => setDeleting(thread.id)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </aside>
        <div className="flex h-[65dvh] min-h-[420px] min-w-0 flex-1 flex-col xl:h-auto xl:min-h-0">
          <Outlet />
        </div>
        <aside className="guide-context min-w-0 border-t border-border bg-muted/20 px-4 xl:w-72 xl:shrink-0 xl:overflow-y-auto xl:border-t-0 xl:border-l">
          <h2 className="py-4 font-display text-lg">{t("我的农场伙伴", "My farm companion")}</h2>
          <GuideContext />
          <FarmerAssistantPanel onDiscuss={newChat} />
          <details className="border-b border-border py-4"><summary className="cursor-pointer font-display text-lg">{t("今天心情如何？", "How are you today?")}</summary><MoodCheckIn /></details>
          <EvidenceNotes />
        </aside>
      </div>
      <Dialog
        open={!!deleting}
        onOpenChange={(value) => {
          if (!value && !working) setDeleting(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("删除这段对话？", "Delete this conversation?")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {t(
              "删除后无法恢复对话和消息。",
              "This permanently deletes the conversation and its messages.",
            )}
          </p>
          <DialogFooter>
            <Button variant="outline" disabled={working} onClick={() => setDeleting(null)}>
              {t("取消", "Cancel")}
            </Button>
            <Button variant="destructive" disabled={working} onClick={deleteChat}>
              {t("删除", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
