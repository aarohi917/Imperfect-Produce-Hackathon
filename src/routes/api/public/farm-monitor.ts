import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { z } from "zod";
export const Route = createFileRoute("/api/public/farm-monitor")({
  server:{handlers:{POST:async ({request})=>{
    const failure=await authenticateCronRequest(request);
    if(failure) return failure;
    const parsed=z.object({kind:z.literal("monitor")}).safeParse(await request.json().catch(()=>null));
    if(!parsed.success) return new Response("Invalid job",{status:400});
    const {supabaseAdmin}=await import("@/integrations/supabase/client.server");
    const {runFarmMonitoring}=await import("@/lib/farm-monitoring.server");
    const result=await runFarmMonitoring(supabaseAdmin);
    return Response.json(result,{status:result.failures ? 500 : 200});
  }}}
});