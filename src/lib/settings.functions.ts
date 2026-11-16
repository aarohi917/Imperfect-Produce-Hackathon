import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { LANGUAGES, CURRENCIES, validTimeZone } from "./localization";
export const loadSettings = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).handler(async ({context}) => {
  const {data,error} = await context.supabase.from("user_settings").select("language,currency,time_zone,week_starts_on,monitoring_enabled,proactive_notifications").eq("user_id",context.userId).maybeSingle();
  if(error) throw new Error("Could not load settings");
  return data;
});
export const saveSettings = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator(z.object({language:z.enum(LANGUAGES),currency:z.enum(CURRENCIES),timeZone:z.string().refine(validTimeZone),weekStartsOn:z.enum(["sunday","monday"]).default("monday"),monitoringEnabled:z.boolean().default(true),proactiveNotifications:z.boolean().default(true)})).handler(async ({context,data}) => {
  const {error} = await context.supabase.from("user_settings").upsert({user_id:context.userId,language:data.language,currency:data.currency,time_zone:data.timeZone,week_starts_on:data.weekStartsOn,monitoring_enabled:data.monitoringEnabled,proactive_notifications:data.proactiveNotifications,updated_at:new Date().toISOString()});
  if(error) throw new Error("Could not save settings");
  return {ok:true};
});