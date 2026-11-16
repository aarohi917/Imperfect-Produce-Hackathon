import { useSettings, useT } from "@/lib/i18n";
import { formatDate, formatMoney } from "@/lib/localization";
import { vegLabel } from "@/lib/vegetables";
import { findingLabel } from "@/lib/finding-label";
import type { ReportSnapshot } from "@/lib/farm-monitoring";
export function FarmReport({start,end,currency,snapshot}:{start:string;end:string;currency:string;snapshot:ReportSnapshot}) {
  const t=useT(),settings=useSettings();
  const money=(v:number)=>formatMoney(v,currency,settings.language);
  const {current,previous}=snapshot;
  return <div className="mt-3 space-y-3 text-sm">
    <p className="font-semibold">{formatDate(start,settings)} – {formatDate(end,settings)}</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <p>{t("采收重量","Harvest weight","कटाई का वजन","कापणीचे वजन")}<strong className="block">{current.kg.toFixed(1)} {t("公斤","kg")}</strong></p>
      <p>{t("预计收入","Expected revenue")}<strong className="block">{money(current.revenue)}</strong></p>
      <p>{t("记录成本","Recorded cost","दर्ज लागत","नोंदवलेला खर्च")}<strong className="block">{money(current.cost)}</strong></p>
      <p>{t("预计毛利","Expected gross profit")}<strong className="block">{money(current.profit)}</strong></p>
    </div>
    {current.count>0 && previous.count>0 ? <p>{t("与前一周相比","Compared with the previous week","पिछले सप्ताह की तुलना में","मागील आठवड्याच्या तुलनेत")}: {t("采收","Harvest")}: {(current.kg-previous.kg).toFixed(1)} {t("公斤","kg")}; {t("预计毛利","Expected gross profit")}: {money(current.profit-previous.profit)}.</p> : <p className="text-muted-foreground">{t("缺少本周或前一周已核对记录，无法确定趋势。","Checked records are missing for one or both weeks; trends cannot be established.","इस या पिछले सप्ताह के जाँचे रिकॉर्ड नहीं हैं; रुझान तय नहीं किया जा सकता।","या मागील आठवड्याच्या पडताळलेल्या नोंदी नाहीत; कल ठरवता येत नाही.")}</p>}
    {snapshot.crops.map(c=><p key={c.crop}>{vegLabel(c.crop,settings.language)}: {c.kg.toFixed(1)} {t("公斤","kg")} · {t("预计毛利","Expected gross profit")}: {money(c.profit)}</p>)}
    {snapshot.findings.map(f=><div key={f.key}><p className="font-semibold">{findingLabel(f,settings.language,currency)}</p><p>{findingLabel(f,settings.language,currency,true)}</p></div>)}
    {snapshot.goals.map(g=><p key={g.id}><strong>{g.title}</strong>: {g.current===null?t("暂无测量","Not measured"):g.metric==="expected_profit"?money(g.current):g.current.toFixed(2)} / {g.metric==="expected_profit"?money(g.target):g.target}{g.metric==="margin"?"%":""} · {g.targetObserved?t("数值达到目标，需确认","Target observed; confirmation needed","लक्ष्य का मान मिला; पुष्टि जरूरी","लक्ष्याचे मूल्य दिसले; पुष्टी आवश्यक"):g.assessment==="behind"?t("期限已过，未达目标","Deadline passed; target not met","समय बीता; लक्ष्य नहीं मिला","मुदत संपली; लक्ष्य गाठले नाही"):t("不足以判断是否按计划进行","Insufficient evidence to assess the plan","योजना की प्रगति का पर्याप्त प्रमाण नहीं","योजनेच्या प्रगतीसाठी पुरेसा पुरावा नाही")}</p>)}
    <p className="text-muted-foreground">{t("仅统计已核对采收。预计金额并非实收款；未售重量、扣款和实际损耗尚未记录。","Only checked harvests count. Expected amounts are not payments; unsold weight, deductions and actual losses are not recorded.","केवल जाँची कटाई गिनी गई। अनुमानित रकम भुगतान नहीं है; बिना बिकी उपज, कटौती और वास्तविक नुकसान दर्ज नहीं हैं।","फक्त पडताळलेली कापणी मोजली. अपेक्षित रक्कम म्हणजे भुगतान नाही; न विकलेले वजन, कपात आणि प्रत्यक्ष नुकसान नोंदवलेले नाही.")}</p>
    <p>{t("下一步：核对待审核采收，比较每公斤售价与成本，并在指导中复核目标与可行措施。","Next: check pending harvests, compare price and cost per kg, and revisit goals and practical actions in the guide.","अगला कदम: लंबित कटाई जाँचें, प्रति किलो कीमत और लागत की तुलना करें और मार्गदर्शक में लक्ष्य व कार्य की समीक्षा करें।","पुढे: प्रलंबित कापणी तपासा, प्रति किलो भाव आणि खर्च तुलना करा आणि मार्गदर्शकात उद्दिष्टे व कृतींचा आढावा घ्या.")}</p>
  </div>;
}