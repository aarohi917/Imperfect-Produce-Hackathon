import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { loadGuideThread } from "@/lib/guide-history.functions";
import { pageMeta } from "@/lib/page-meta";
import type { UIMessage } from "ai";
import { GuideChat } from "@/components/GuideChat";
const threadQuery = (threadId: string) =>
  queryOptions({
    queryKey: ["guide-thread", threadId],
    queryFn: () => loadGuideThread({ data: { threadId } }),
    staleTime: 0,
  });
export const Route = createFileRoute("/_authenticated/guide/$threadId")({
  head: () =>
    pageMeta(
      "田间伙伴对话 — 丑蔬 Imperfect Produce",
      "继续您的私人农业指导对话，查看已保存的建议和采收讨论。",
    ),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(threadQuery(params.threadId)),
  component: Thread,
  errorComponent: ({ error }) => (
    <p role="alert" className="p-4 text-destructive">
      {error instanceof Error ? error.message : "Conversation unavailable"}
    </p>
  ),
});
function Thread() {
  const { threadId } = Route.useParams();
  const { data } = useSuspenseQuery(threadQuery(threadId));
  return (
    <GuideChat
      key={threadId}
      threadId={threadId}
      initialMessages={JSON.parse(data.messagesJson) as UIMessage[]}
      goalTitle={data.goalTitle}
    />
  );
}
