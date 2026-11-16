import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useT, useLang } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { FarmWorkbench } from "@/components/FarmWorkbench";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { pageMeta } from "@/lib/page-meta";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => pageMeta("数据分析 — 丑蔬 Imperfect Produce", "按已核对作物记录统计重量、预计收入和预计毛利；公开研究单独列示。"),
  component: Dashboard,
});

function Dashboard() {
  const t = useT();
  const { data: me } = useMe();
  const { data: rows = [], isPending, error, refetch } = useQuery({
    queryKey: ["all-harvests", me?.user.id],
    enabled: !!me?.isManagement,
    queryFn: async () => {
      // Read every accessible row in pages; never silently truncate company totals.
      const rows = [];
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await supabase.from("harvests").select("id,vegetable,quantity,destination,expected_revenue,cost,status,created_at,harvest_date,grade,farmer_id,field_name,notes,review_note,reviewed_at,currency").eq("report_type", "harvest").order("harvest_date").order("id").range(offset, offset + 499);
        if (error) throw error;
        rows.push(...(data ?? []));
        if (!data || data.length < 500) break;
      }
      return rows;
    },
  });
  if (me && !me.isManagement) return <Navigate to="/overview" replace />;
  if (isPending) return <p className="flex items-center gap-2 py-10 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{t("正在读取采收记录…", "Reading harvest records…")}</p>;
  if (error) return <div role="alert" className="py-10"><p className="text-destructive">{t("无法读取记录，未显示统计。", "Records could not be read; totals are not shown.")}</p><Button className="mt-3" onClick={() => refetch()}>{t("重试", "Retry")}</Button></div>;
  return <FarmWorkbench rows={rows} staff={!!me?.isStaff} />;
}
