import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { managementAccess } from "./workspace-policy";
export async function isManagement(db: SupabaseClient<Database>, userId: string) {
  const [roles, memberships] = await Promise.all([
    db.from("user_roles").select("role").eq("user_id", userId),
    db.from("comm_org_members").select("role").eq("user_id", userId),
  ]);
  if (roles.error || memberships.error) throw new Error("Could not verify workspace access");
  return managementAccess(roles.data.map(r => r.role), memberships.data);
}