import { useMe } from "@/lib/auth";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang, useT, useSettings } from "@/lib/i18n";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { GuideReply } from "./GuideReply";
import { Button } from "./ui/button";
import { useServerFn } from "@tanstack/react-start";
import { saveFarmerMemory } from "@/lib/farmer-assistant.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Sprout, Brain } from "lucide-react";

export function GuideChat({
  threadId,
  initialMessages,
  goalTitle,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  goalTitle?: string | null;
}) {
  const settings = useSettings();
  const {data:me}=useMe();
  const lang = useLang(),
    t = useT(),
    qc = useQueryClient();
  const saveMemory=useServerFn(saveFarmerMemory);
  const [memoryDraft,setMemoryDraft]=useState<string|null>(null),[memoryBusy,setMemoryBusy]=useState(false),[memoryError,setMemoryError]=useState(false);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState(goalTitle && !initialMessages.length ? t(`请结合我的实际记录，为目标“${goalTitle}”制定或更新分步计划，说明衡量方法与需要补充的信息。`, `Create or update a step-by-step plan for my goal "${goalTitle}" using my records, with measurements and any missing information.`, `मेरे रिकॉर्ड के आधार पर लक्ष्य “${goalTitle}” की चरणबद्ध योजना बनाएँ, माप और आवश्यक जानकारी बताएँ।`, `माझ्या नोंदींनुसार “${goalTitle}” उद्दिष्टाची टप्प्याटप्प्याने योजना करा, मोजमाप आणि आवश्यक माहिती सांगा.`) : "");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/public/guide-chat",
        body: () => ({ threadId, lang, currency:settings.currency,timeZone:settings.timeZone }),
        headers: async () => {
          const { data } = await supabase.auth.getSession();
          return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
        },
      }),
    [threadId, lang,settings.currency,settings.timeZone],
  );
  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onFinish: () => {
      void qc.invalidateQueries({ queryKey: ["guide-threads"] });
      void qc.invalidateQueries({ queryKey: ["guide-thread", threadId] });
    },
    onError: () => {
      void qc.invalidateQueries({ queryKey: ["guide-threads"] });
    },
  });
  const busy = status === "submitted" || status === "streaming";
  useEffect(() => {
    textarea.current?.focus();
  }, [threadId, busy]);
  async function send(value: string) {
    if (busy || !value.trim()) return;
    setText("");
    textarea.current?.focus();
    await sendMessage({ text: value.trim() });
  }
  const starters = [...(me?.isManagement ? [t("我哪种作物最赚钱？","Which crop earns me the most?"),t("我的毛利率偏低，应该检查什么？","My margin is low — what should I check?")] : [t("今天应该先采收什么？","What should I harvest first today?","आज पहले क्या काटूँ?","आज आधी काय कापणी करू?"),t("如何检查采收质量？","How should I check harvest quality?","कटाई की गुणवत्ता कैसे जाँचूँ?","कापणीची गुणवत्ता कशी तपासू?")]),t("怎样有机防治蚜虫？","How do I control aphids organically?"),t("这周我很累。","I'm exhausted this week.")];
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 p-4 md:p-6">
          {!messages.length && (
            <div className="my-auto max-w-xl py-6 md:py-10">
              <h2 className="text-3xl">{t("田间伙伴", "Field Friend")}</h2>
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {starters.map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    variant="outline"
                    className="h-auto min-h-14 justify-start whitespace-normal px-3 py-3 text-left leading-relaxed"
                    onClick={() => send(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {messages.map((message) => (
            <Message key={message.id} from={message.role}>
              <MessageContent
                className={
                  message.role === "user"
                    ? "group-[.is-user]:rounded-sm group-[.is-user]:bg-secondary group-[.is-user]:text-secondary-foreground"
                    : "w-full"
                }
              >
                {message.parts.map((part, i) =>
                  part.type === "text" ? (
                    message.role === "assistant" ? (
                      <GuideReply key={i} content={part.text} />
                    ) : (
                      <p
                        key={i}
                        className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
                      >
                        {part.text}
                      </p>
                    )
                  ) : null,
                )}
              </MessageContent>
            </Message>
          ))}
          {messages.some(m=>m.role === "user") && <Button variant="ghost" size="sm" className="self-start" onClick={()=>{const latest=messages.filter(m=>m.role === "user").at(-1);setMemoryDraft(latest?.parts.filter(p=>p.type === "text").map(p=>p.type === "text"?p.text:"").join(" ").slice(0,1000) ?? "");setMemoryError(false);}}><Brain/>{t("从对话保存农场记忆","Save farm memory from conversation","बातचीत से खेत की याद सहेजें","संभाषणातून शेताची आठवण जतन करा")}</Button>}
          {status === "submitted" && (
            <Shimmer>{t("田间伙伴正在思考…", "Field Friend is thinking…")}</Shimmer>
          )}
          {error && (
            <p role="alert" className="break-words text-sm text-destructive">
              {error.message}
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <Dialog open={memoryDraft!==null} onOpenChange={open=>{if(!open&&!memoryBusy)setMemoryDraft(null);}}><DialogContent><DialogHeader><DialogTitle>{t("确认农场记忆","Confirm farm memory")}</DialogTitle></DialogHeader><Textarea aria-label={t("农场记忆","Farm memory")} value={memoryDraft ?? ""} maxLength={1000} onChange={e=>setMemoryDraft(e.target.value)}/>{memoryError&&<p role="alert" className="text-destructive">{t("暂时无法保存","Could not save")}</p>}<DialogFooter><Button variant="outline" disabled={memoryBusy} onClick={()=>setMemoryDraft(null)}>{t("取消","Cancel")}</Button><Button disabled={memoryBusy||!memoryDraft?.trim()} onClick={async()=>{if(!memoryDraft?.trim())return;setMemoryBusy(true);setMemoryError(false);try{await saveMemory({data:{content:memoryDraft}});await qc.invalidateQueries({queryKey:["farmer-assistant"]});setMemoryDraft(null);}catch{setMemoryError(true);}finally{setMemoryBusy(false);}}}>{t("确认保存","Confirm and save")}</Button></DialogFooter></DialogContent></Dialog>
      <div className="shrink-0 border-t border-border bg-background p-3 md:p-4">
        <PromptInput onSubmit={({ text: value }) => send(value)}>
          <PromptInputTextarea
            ref={textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={4000}
            aria-label={t("输入您的问题", "Your question")}
            placeholder={t("输入您的问题…", "Type your question…")}
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={status}
              disabled={busy || !text.trim()}
              aria-label={t("发送", "Send")}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
