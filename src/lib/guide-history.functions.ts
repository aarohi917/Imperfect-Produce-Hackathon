import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { defaultChatTitle } from "./guide-history";

const id = z.object({ threadId: z.string().uuid() });
export const listGuideThreads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("guide_threads")
      .select("*")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error("无法读取聊天记录 / Could not load chat history");
    // Older releases persisted automatic dates in Shanghai time without a custom-title flag.
    // Recognize only exact generated titles; preserve every other renamed title.
    const {data:messages,error:messageError} = await context.supabase.from("guide_messages").select("thread_id,message,created_at").eq("user_id",context.userId).eq("message->>role","user").order("created_at");
    if(messageError) throw new Error("Could not load chat topics");
    return data.map(thread => {
      if(thread.auto_topic || !thread.title) return thread;
      const first=messages.find(m=>m.thread_id===thread.id)?.message;
      if(!first || typeof first!=="object" || Array.isArray(first)) return thread;
      const parts=first['parts'];
      if(!Array.isArray(parts)) return thread;
      const text=parts.filter(p=>p && typeof p==="object" && !Array.isArray(p) && p['type']==="text").map(p=>p && typeof p==="object" && !Array.isArray(p)?String(p['text']??""):"").join("\n");
      const raw=text.split(/[。！？!?\n]/)[0]?.replace(/\s+/g," ").trim().replace(/[?？。.!！]+$/,"") ?? "";
      const generated=[defaultChatTitle(thread.created_at,text,"en","Asia/Shanghai"),defaultChatTitle(thread.created_at,text,"zh","Asia/Shanghai")];
      const oldTopic=text.replace(/\s+/g," ").trim().replace(/[?？。.!！]+$/,"");
      const storedTopic=thread.title.split(" – ").slice(1).join(" – ");
      const rawMatch=/^(?:\w+ \d{1,2}, \d{4}|\d{4}年\d{1,2}月\d{1,2}日) – /.test(thread.title) && [raw.slice(0,60)+(raw.length>60?"…":""),oldTopic.slice(0,60)+(oldTopic.length>60?"…":"")].includes(storedTopic);
      return generated.includes(thread.title)||rawMatch ? {...thread,auto_topic:text,title_custom:false} : thread;
    });
  });
export const createGuideThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ harvestId: z.string().uuid().nullable().optional(), goalId: z.string().uuid().optional() }))
  .handler(async ({ context, data }) => {
    if (data.goalId) {
      const {data:goal,error} = await context.supabase.from("farmer_goals").select("id").eq("id",data.goalId).eq("user_id",context.userId).single();
      if(error || !goal) throw new Error("目标不存在 / Goal unavailable");
    }
    const { data: thread, error } = await context.supabase
      .from("guide_threads")
      .insert({ user_id: context.userId, harvest_id: data.harvestId ?? null, goal_id: data.goalId ?? null })
      .select()
      .single();
    if (error) throw new Error("无法新建对话 / Could not create conversation");
    return thread;
  });
export const loadGuideThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(id)
  .handler(async ({ context, data }) => {
    const { data: thread, error } = await context.supabase
      .from("guide_threads")
      .select("*")
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .single();
    if (error) throw new Error("对话不存在或无法读取 / Conversation unavailable");
    const { data: rows, error: messagesError } = await context.supabase
      .from("guide_messages")
      .select("message")
      .eq("thread_id", thread.id)
      .eq("user_id", context.userId)
      .order("created_at")
      .order("id");
    if (messagesError) throw new Error("无法读取对话 / Could not load conversation");
    let goalTitle: string | null = null;
    if(thread.goal_id) {
      const {data:goal,error:goalError}=await context.supabase.from("farmer_goals").select("title").eq("id",thread.goal_id).eq("user_id",context.userId).single();
      if(!goalError && goal) goalTitle=goal.title;
    }
    return { thread, goalTitle, messagesJson: JSON.stringify(rows.map((row) => row.message)) };
  });
export const renameGuideThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(id.extend({ title: z.string().trim().min(1).max(180) }))
  .handler(async ({ context, data }) => {
    const { error, data: row } = await context.supabase
      .from("guide_threads")
      .update({ title: data.title, title_custom: true })
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .select("id")
      .single();
    if (error || !row) throw new Error("无法重命名 / Could not rename conversation");
    return { ok: true };
  });
export const deleteGuideThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(id)
  .handler(async ({ context, data }) => {
    const { error, data: row } = await context.supabase
      .from("guide_threads")
      .delete()
      .eq("id", data.threadId)
      .eq("user_id", context.userId)
      .select("id")
      .single();
    if (error || !row) throw new Error("无法删除对话 / Could not delete conversation");
    return { ok: true };
  });
