import { translate, type Lang } from "./localization";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { managementAccess } from "./workspace-policy";

export type Role = "farmer" | "hq" | "ceo";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const [roleResult, profileResult, membershipResult] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("comm_org_members").select("role").eq("user_id", user.id),
      ]);
      if (roleResult.error || profileResult.error || membershipResult.error) throw new Error("Could not verify account access");
      const roles=roleResult.data, profile=profileResult.data;
      const r = (roles ?? []).map((x) => x.role as Role);
      return {
        user,
        profile,
        roles: r,
        isStaff: r.includes("hq") || r.includes("ceo"),
        isManagement: managementAccess(r, membershipResult.data),
        isCeo: r.includes("ceo"),
      };
    },
  });
}

export const roleLabel = (lang: Lang): Record<Role, string> => ({farmer:translate(lang,"农户","Farmer"),hq:translate(lang,"核对员","Checker"),ceo:translate(lang,"总经理","CEO")});
export const moodEmoji = ["", "😞", "😕", "😐", "🙂", "😄"];
export const moodLabel = (lang: Lang) => ["",translate(lang,"很难受","Struggling"),translate(lang,"低落","Low"),translate(lang,"一般","Okay"),translate(lang,"不错","Good"),translate(lang,"很好","Great")];
