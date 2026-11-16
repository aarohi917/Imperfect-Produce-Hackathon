import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
export const MODEL = "openai/gpt-6-astra";

export class AiGatewayError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Streams a Responses call through Lovable AI and returns the final text. */
export async function runResponses(instructions: string, messages: ModelMessage[]) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiGatewayError(401, "AI is not configured.");
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: GATEWAY,
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      if (!res.ok) {
        const body = await res.clone().text();
        let msg = body;
        try { msg = JSON.parse(body)?.error?.message ?? JSON.parse(body)?.message ?? body; } catch { /* keep */ }
        if (res.status === 402) msg = "AI credits are used up. Top up in Settings → Plans & credits.";
        if (res.status === 429) msg = "AI is busy right now. Please try again in a minute.";
        throw new AiGatewayError(res.status, msg || `AI request failed (${res.status})`);
      }
      return res;
    },
  });
  let failure: unknown;
  const result = streamText({
    model: provider.responses(MODEL),
    instructions,
    messages,
    onError: ({ error }) => { failure = error; },
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
  const text = await result.text;
  if (failure) throw failure instanceof Error ? failure : new Error(String(failure));
  return text;
}
