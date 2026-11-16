import { normalizeSettings, translate } from "./localization";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type UIMessage, type ModelMessage } from "ai";
import type { Database, Json } from "@/integrations/supabase/types";
import { guideInstructions } from "./guide-context.server";
import { MODEL } from "./ai.server";
import { defaultChatTitle, messageText } from "./guide-history";
import {
  createLovableAiGatewayRunIdFetch,
  withLovableAiGatewayRunIdHeader,
} from "./ai-run-id.server";

export async function handleGuideChat(request: Request) {
  const url = process.env["SUPABASE_URL"],
    key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!url || !key || !apiKey) return new Response("Guide is not configured", { status: 503 });
  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return new Response("Please sign in", { status: 401 });
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { Authorization: authorization },
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
  const { data: auth, error: authError } = await supabase.auth.getUser(authorization.slice(7));
  if (authError || !auth.user) return new Response("Please sign in", { status: 401 });
  try {
    const body = await request.json();
    if (typeof body.threadId !== "string" || !Array.isArray(body.messages))
      return new Response("Invalid conversation", { status: 400 });
    const { data: thread, error } = await supabase
      .from("guide_threads")
      .select("*")
      .eq("id", body.threadId)
      .eq("user_id", auth.user.id)
      .single();
    if (error || !thread) return new Response("Conversation unavailable", { status: 404 });
    const incoming = body.messages.at(-1) as UIMessage | undefined;
    if (
      !incoming ||
      incoming.role !== "user" ||
      typeof incoming.id !== "string" ||
      !Array.isArray(incoming.parts)
    )
      return new Response("Invalid message", { status: 400 });
    const text = messageText(incoming).trim();
    if (!text || text.length > 4000)
      return new Response("问题需为1–4000字 / Message must be 1–4000 characters", { status: 400 });
    const { error: saveError } = await supabase
      .from("guide_messages")
      .insert({
        thread_id: thread.id,
        user_id: auth.user.id,
        message_id: incoming.id,
        message: { id: incoming.id, role: "user", parts: [{ type: "text", text }] },
      });
    if (saveError)
      throw new Error(
        "无法保存问题，请重新打开对话 / Could not save question; reopen the conversation",
      );
    const {data:preferences,error:settingsError} = await supabase.from("user_settings").select("*").eq("user_id",auth.user.id).maybeSingle();
    if(settingsError) throw new Error("Could not read settings");
    const settings = normalizeSettings(preferences ? {language:preferences.language as "zh",currency:preferences.currency as "CNY",timeZone:preferences.time_zone} : {language:body.lang,timeZone:body.timeZone,currency:body.currency});
    const lang = settings.language;
    const { error: titleError } = await supabase
      .from("guide_threads")
      .update({
        ...(!thread.title ? { title: defaultChatTitle(thread.created_at, text, lang,settings.timeZone), auto_topic:text, title_custom:false } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", thread.id)
      .eq("user_id", auth.user.id);
    if (titleError) throw new Error("Could not save conversation title");
    // Replay trusted saved text, not arbitrary client-supplied assistant or system messages.
    const { data: saved, error: readError } = await supabase
      .from("guide_messages")
      .select("message")
      .eq("thread_id", thread.id)
      .eq("user_id", auth.user.id)
      .order("created_at")
      .order("id");
    if (readError) throw new Error("Could not read saved messages");
    const originalMessages = saved.map((row) => row.message as unknown as UIMessage);
    const messages: ModelMessage[] = originalMessages
      .slice(-20)
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: messageText(m) }));
    const instructions = await guideInstructions(supabase, auth.user.id, {
      lang,
      harvestId: thread.harvest_id,
      goalId: thread.goal_id,
      threadId: thread.id, question:text,
      currency:settings.currency, timeZone:settings.timeZone,
    });
    const gateway = createLovableAiGatewayRunIdFetch();
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: gateway.fetch,
    });
    const result = streamText({
      model: provider.responses(MODEL),
      instructions,
      messages,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
    });
    const response = result.toUIMessageStreamResponse({
      originalMessages,
      sendReasoning: false,
      onError: (e) => (translate(lang,"指导暂时无法回答，请重试。","Guide unavailable. Please try again.","मार्गदर्शन उपलब्ध नहीं। फिर कोशिश करें।","मार्गदर्शन उपलब्ध नाही. पुन्हा प्रयत्न करा.")),
      onFinish: async ({ responseMessage }) => {
        if (!messageText(responseMessage).trim()) return;
        const { error: persistError } = await supabase
          .from("guide_messages")
          .insert({
            thread_id: thread.id,
            user_id: auth.user.id,
            message_id: responseMessage.id,
            message: JSON.parse(JSON.stringify(responseMessage)) as Json,
          });
        if (persistError) {
          console.error("Guide response persistence failed", persistError.code);
          throw new Error(
            "回答未保存，请重新打开对话确认 / Reply could not be saved; reopen to check",
          );
        }
        const { error: updateError } = await supabase
          .from("guide_threads")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", thread.id)
          .eq("user_id", auth.user.id);
        if (updateError) throw new Error("Could not update conversation");
      },
    });
    // Consume independently so navigating away does not discard the completed reply.
    void result.consumeStream({
      onError: (e) =>
        console.error("Guide stream failed", e instanceof Error ? e.message : "unknown"),
    });
    return withLovableAiGatewayRunIdHeader(response, gateway, { "Cache-Control": "no-store" });
  } catch (e) {
    console.error("Guide chat failed", e instanceof Error ? e.message : "unknown");
    return new Response(e instanceof Error ? e.message : "Guide unavailable", { status: 500 });
  }
}
