import { translate, formatMoney, type Lang } from "./localization";
import { findingLabel } from "./finding-label";
import type { Finding } from "./farmer-assistant";
import { vegLabel, destLabel, VEGETABLES } from "./vegetables";
export function notificationLabel(n: {title:string;body:string;event_type?:string|null;details?:unknown},lang:Lang) {
  const details = n.details && typeof n.details === "object" ? n.details as Record<string,unknown> : null;
  if (n.event_type === "visual_intelligence") return { title: `${translate(lang,"视觉智能报告","Visual Intelligence report","दृश्य बुद्धिमत्ता रिपोर्ट","दृश्य बुद्धिमत्ता अहवाल")}: ${Number(details?.['itemCount'] ?? 0)} ${translate(lang,"件","items","वस्तुएँ","वस्तू")}, ${translate(lang,"平均评分","avg quality","औसत गुणवत्ता","सरासरी गुणवत्ता")} ${details?.['averageQuality'] ?? "—"}`, body: translate(lang,"视觉估计，等待核对；不代表实际重量或食品安全。","Visual estimates for checking—not measured weight or food safety.","जाँच हेतु दृश्य अनुमान—मापा वजन या खाद्य सुरक्षा नहीं।","पडताळणीसाठी दृश्य अंदाज—मोजलेले वजन किंवा अन्न सुरक्षा नाही."), pending: details?.['status'] === "pending" };
  if(n.event_type === "communication") return {title:translate(lang,"新沟通消息","New communication message","नया संवाद संदेश","नवीन संवाद संदेश"),body:translate(lang,"打开您的私人对话。","Open your private conversation.","अपनी निजी बातचीत खोलें।","तुमचे खाजगी संभाषण उघडा."),pending:false};
  if(n.event_type === "farm_report") return {title:translate(lang,"每周农场报告","Weekly farm report","साप्ताहिक खेत रिपोर्ट","साप्ताहिक शेत अहवाल"),body:`${String(details?.['start'] ?? "")} – ${String(details?.['end'] ?? "")}`,pending:false};
  if(n.event_type === "farm_alert" && details?.['finding']) {
    const finding=details['finding'] as Finding, currency=String(details['currency'] ?? "CNY");
    const goals=Array.isArray(details['goals']) ? details['goals'].filter((g):g is {title:string}=>!!g && typeof g === "object" && typeof g.title === "string").map(g=>g.title) : [];
    const goalText=goals.length ? ` ${translate(lang,"相关目标","Related goals","संबंधित लक्ष्य","संबंधित उद्दिष्टे")}: ${goals.join(" · ")}.` : "";
    return {title:translate(lang,"值得留意的农场变化","Farm change worth checking","खेत में ध्यान देने योग्य बदलाव","शेतातील लक्ष देण्यासारखा बदल"),body:`${findingLabel(finding,lang,currency)} ${findingLabel(finding,lang,currency,true)}${goalText}`,pending:false};
  }
  const pending = n.event_type === "harvest_submitted" || /新采收|awaiting/i.test(n.title);
  const status = details?.['status'] ?? (/approved|批准/.test(n.title)?"approved":/rejected|驳回/.test(n.title)?"rejected":"pending");
  const title = pending ? translate(lang,"新采收等待核对","New harvest awaiting checks","नई कटाई जाँच की प्रतीक्षा में","नवीन कापणी पडताळणीच्या प्रतीक्षेत") : status === "approved" ? translate(lang,"采收已批准","Harvest approved","कटाई स्वीकृत","कापणी मंजूर") : translate(lang,"采收已驳回","Harvest rejected","कटाई अस्वीकृत","कापणी नामंजूर");
  if(details) return {title,body:`${String(details['farmer'] ?? "")} · ${vegLabel(String(details['vegetable'] ?? ""),lang)} · ${Number(details['quantity'])} ${translate(lang,"公斤","kg")} → ${destLabel(String(details['destination']),lang)} · ${translate(lang,"预计收入","Expected revenue")}: ${formatMoney(Number(details['revenue']),String(details['currency'] ?? "CNY"),lang)}${details['note'] ? ` · ${String(details['note'])}` : ""}`,pending};
  // Legacy notifications retain original farmer text; reconstruct system text from known structured fragments.
  const crop=VEGETABLES.find(v=>n.body.includes(v));
  const kg=n.body.match(/(\d+(?:\.\d+)?)\s*(?:公斤|kg)/)?.[1];
  const destination=/工厂|factory/.test(n.body)?"factory":"market";
  return {title,body:crop ? `${vegLabel(crop,lang)} · ${kg ?? ""} ${translate(lang,"公斤","kg")} → ${destLabel(destination,lang)}` : title,pending};
}