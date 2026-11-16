import { z } from "zod";

export const visualItemSchema = z.object({
  id: z.number().int().positive(),
  type: z.string().trim().min(1).max(80),
  confidence: z.number().min(0).max(1),
  sizeCm: z.number().positive().max(100000).nullable(),
  qualityScore: z.number().min(0).max(100).nullable(),
  grade: z.enum(["Good", "Fair", "Poor"]).nullable(),
  blemishPct: z.number().min(0).max(100).nullable(),
}).strict();
export const visualItemsSchema = z.array(visualItemSchema).min(1).max(500);
export type VisualItem = z.infer<typeof visualItemSchema>;

export function summarizeVisualItems(input: VisualItem[]) {
  const items = visualItemsSchema.parse(input);
  const counts: Record<string, number> = {};
  const grades = { Good: 0, Fair: 0, Poor: 0, Unknown: 0 };
  const scores: number[] = [];
  for (const item of items) {
    counts[item.type] = (counts[item.type] ?? 0) + 1;
    grades[item.grade ?? "Unknown"]++;
    if (item.qualityScore !== null) scores.push(item.qualityScore);
  }
  return {
    items, itemCount: items.length, counts, grades,
    averageQuality: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    verdict: `${grades.Good} of ${items.length} items Good, ${grades.Fair} Fair, ${grades.Poor} Poor, ${grades.Unknown} unknown`,
  };
}

export function parseVisualItems(value: unknown): VisualItem[] {
  const result = visualItemsSchema.safeParse(value);
  return result.success ? result.data : [];
}