import { translate, normalizeSettings, languageNames, type Lang } from "./localization";
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { VEGETABLES, normalizeVegetable } from "./vegetables";

export type PhotoEstimate = { vegetable: string; quantity: number; grade: string; summary: string };

export const analyzeHarvestPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { dataUrl: string; lang?: Lang }) => {
    if (!input?.dataUrl?.startsWith("data:image/")) throw new Error(translate(input.lang ?? "zh","请上传图片。","Please upload a photo.","फोटो अपलोड करें।","फोटो अपलोड करा."));
    if (input.dataUrl.length > 8_000_000) throw new Error(translate(input.lang ?? "zh","图片太大。","The photo is too large.","फोटो बहुत बड़ी है।","फोटो खूप मोठा आहे."));
    return input;
  })
  .handler(async ({ data }): Promise<PhotoEstimate> => {
    const { runResponses } = await import("./ai.server");
    const text = await runResponses(
      `你是有机农场的农产品质检员。识别照片中的主要蔬菜，并估算总重量（公斤）。标准周转筐约装 15-20 公斤，编织袋约 25 公斤。质量等级：A（可直接上市）、B（轻微瑕疵）、C（仅供加工）。只回复 JSON：{"vegetable": 从以下选择 ${VEGETABLES.join("、")}, "kg": 数字, "grade": "A"|"B"|"C", "summary": 一句${languageNames[data.lang ?? "zh"]}说明质量和估算依据}。`,
      [
        {
          role: "user",
          content: [
            { type: "text", text: "请估算这批采收。" },
            {
              type: "file",
              mediaType: data.dataUrl.slice(5, data.dataUrl.indexOf(";")),
              data: data.dataUrl.slice(data.dataUrl.indexOf(",") + 1),
            },
          ],
        },
      ],
    );
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error(translate(data.lang ?? "zh","AI 无法识别这张照片，请手动填写。","AI could not read the photo; enter the details manually.","एआई फोटो नहीं पढ़ सका; जानकारी खुद भरें।","एआयला फोटो वाचता आला नाही; माहिती स्वतः भरा."));
    const j = JSON.parse(match[0]);
    return {
      vegetable: normalizeVegetable(String(j.vegetable ?? "")),
      quantity: Math.round((Number(j.kg) || 0) * 10) / 10,
      grade: ["A", "B", "C"].includes(j.grade) ? j.grade : "A",
      summary: String(j.summary ?? ""),
    };
  });

type ChatMsg = { role: "user" | "assistant"; content: string };
export const askFarmGuide = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { messages: ChatMsg[]; harvestId?: string | null; lang?: Lang }) => {
      const msgs = (input?.messages ?? [])
        .slice(-20)
        .filter(
          (m) =>
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim(),
        );
      if (!msgs.length || msgs.at(-1)?.role !== "user") throw new Error("请先输入问题。");
      const harvestId =
        typeof input.harvestId === "string" && /^[0-9a-f-]{36}$/.test(input.harvestId)
          ? input.harvestId
          : null;
      return {
        harvestId,
        lang: normalizeSettings({language:input.lang ?? "zh"}).language,
        messages: msgs.map((m) => ({ role: m.role, content: m.content.slice(0, 4000) })),
      };
    },
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { guideInstructions } = await import("./guide-context.server");
    const { runResponses } = await import("./ai.server");
    const reply = await runResponses(
      await guideInstructions(supabase, userId, data),
      data.messages,
    );
    return { reply };
  });
