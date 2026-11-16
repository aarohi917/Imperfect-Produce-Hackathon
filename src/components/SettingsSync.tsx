import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMe } from "@/lib/auth";
import { applySettings } from "@/lib/i18n";
import { normalizeSettings } from "@/lib/localization";
import { loadSettings } from "@/lib/settings.functions";
export function SettingsSync() {
  const {data:me} = useMe(), load = useServerFn(loadSettings);
  const {data} = useQuery({queryKey:["user-settings",me?.user.id],enabled:!!me,queryFn:()=>load()});
  useEffect(() => {
    if(data) applySettings(normalizeSettings({language:data.language as "zh",currency:data.currency as "CNY",timeZone:data.time_zone,weekStartsOn:data.week_starts_on as "sunday"|"monday",monitoringEnabled:data.monitoring_enabled,proactiveNotifications:data.proactive_notifications}));
  },[data]);
  return null;
}