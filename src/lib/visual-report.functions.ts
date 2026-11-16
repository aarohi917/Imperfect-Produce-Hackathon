import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { visualItemsSchema } from "./visual-report";

export const submitVisualReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ photo_path: z.string().max(200), items: visualItemsSchema }).strict())
  .handler(async ({ context, data }) => {
    if (!data.photo_path.startsWith(`${context.userId}/`)) throw new Error("Invalid photo owner");
    const { data: id, error } = await context.supabase.rpc("submit_operational_harvest", {
      p_record: { report_type: "visual_intelligence", photo_path: data.photo_path, visual_items: data.items },
    });
    if (error) throw new Error("Could not send visual report. Please retry.");
    return { id };
  });