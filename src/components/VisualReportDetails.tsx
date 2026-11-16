import { parseVisualItems, summarizeVisualItems } from "@/lib/visual-report";
import { useT } from "@/lib/i18n";

export function VisualReportDetails({ value }: { value: unknown }) {
  const t = useT();
  const items = parseVisualItems(value);
  if (!items.length) return <p>{t("无法读取视觉报告。", "Could not read visual report.", "दृश्य रिपोर्ट नहीं पढ़ सके।", "दृश्य अहवाल वाचता आला नाही.")}</p>;
  const summary = summarizeVisualItems(items);
  const grade = (g: string | null) => g === "Good" ? t("良好", "Good", "अच्छा", "चांगले") : g === "Fair" ? t("一般", "Fair", "सामान्य", "सामान्य") : g === "Poor" ? t("较差", "Poor", "खराब", "खराब") : "—";
  return <div className="space-y-3">
    <p className="font-semibold">{t("视觉智能报告", "Visual Intelligence report", "दृश्य बुद्धिमत्ता रिपोर्ट", "दृश्य बुद्धिमत्ता अहवाल")} · {summary.itemCount} {t("件", "items", "वस्तुएँ", "वस्तू")} · {t("平均评分", "Average quality", "औसत गुणवत्ता", "सरासरी गुणवत्ता")} {summary.averageQuality ?? "—"}</p>
    <p className="text-sm">{Object.entries(summary.counts).map(([crop, count]) => `${crop}: ${count}`).join(" · ")}</p>
    <p className="text-sm">{grade("Good")}: {summary.grades.Good} · {grade("Fair")}: {summary.grades.Fair} · {grade("Poor")}: {summary.grades.Poor} · {t("未知", "Unknown", "अज्ञात", "अज्ञात")}: {summary.grades.Unknown}</p>
    <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr>{["#", t("作物", "Crop", "फसल", "पीक"), t("置信度", "Confidence", "विश्वास", "विश्वास"), "cm", t("评分", "Score", "स्कोर", "गुण"), t("等级", "Grade", "श्रेणी", "दर्जा"), t("瑕疵 %", "Blemish %", "दाग %", "डाग %")].map(h => <th key={h} className="border-b border-border px-2 py-2">{h}</th>)}</tr></thead><tbody>{items.map(i => <tr key={i.id}><td className="px-2 py-2">{i.id}</td><td className="px-2">{i.type}</td><td className="px-2">{Math.round(i.confidence * 100)}%</td><td className="px-2">{i.sizeCm?.toFixed(1) ?? "—"}</td><td className="px-2">{i.qualityScore ?? "—"}</td><td className="px-2">{grade(i.grade)}</td><td className="px-2">{i.blemishPct ?? "—"}</td></tr>)}</tbody></table></div>
    <p className="text-xs text-muted-foreground">{t("视觉估计，不代表实际重量、食品安全或有机认证。", "Visual estimates—not measured weight, food safety, or organic certification.", "दृश्य अनुमान—मापा वजन, खाद्य सुरक्षा या जैविक प्रमाणन नहीं।", "दृश्य अंदाज—मोजलेले वजन, अन्न सुरक्षा किंवा सेंद्रिय प्रमाणन नाही.")}</p>
  </div>;
}