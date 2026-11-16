import type { Finding } from "./farmer-assistant";
import { formatMoney, type Lang } from "./localization";
import { vegLabel } from "./vegetables";
export function findingLabel(f: Finding, lang: Lang, currency: string, next = false) {
  const crop = f.crop ? vegLabel(f.crop,lang) : "";
  if(lang === "zh" || lang === "en") {
    const text = next ? (lang === "zh" ? f.nextZh : f.nextEn) : (lang === "zh" ? f.zh : f.en);
    return text.replaceAll(f.crop ?? "\u0000",crop).replace(/¥([\d.]+)/g,(_,n:string)=>formatMoney(Number(n),currency,lang,2));
  }
  const nums = f.en.match(/\d+(?:\.\d+)?/g) ?? [];
  if(f.key.startsWith("margin")) return next ? (lang==="hi"?"पहले प्रति किलोग्राम अनुमानित कीमत और लागत जाँचें। कारण प्रमाणित नहीं और यह प्राप्त भुगतान नहीं है।":"प्रथम प्रति किलोग्रॅम अपेक्षित भाव आणि खर्च तपासा. कारण पडताळलेले नाही आणि हे मिळालेले पैसे नाहीत.") : (lang==="hi"?`${crop}: पिछली तीन जाँची गई खेपों में अनुमानित लाभ ${nums[0]}% से ${nums[1]}% हुआ।`:`${crop}: मागील तीन पडताळलेल्या तुकड्यांचा अपेक्षित नफा ${nums[0]}% वरून ${nums[1]}% झाला.`);
  if(f.key.startsWith("cost")) return next ? (lang==="hi"?"सामग्री, श्रम, परिवहन और लागत बाँटने की जाँच करें; यह अंतर बर्बादी का प्रमाण नहीं है।":"सामग्री, मजुरी, वाहतूक आणि खर्च वाटप तपासा; हा फरक अपव्ययाचा पुरावा नाही.") : (lang==="hi"?`${crop}: नवीनतम प्रति किलोग्राम लागत ${formatMoney(Number(nums[0]),currency,lang,2)} है, पिछली तीन खेपों से 50% से अधिक।`:`${crop}: नवीनतम प्रति किलोग्रॅम खर्च ${formatMoney(Number(nums[0]),currency,lang,2)} आहे, मागील तीन तुकड्यांपेक्षा 50% पेक्षा जास्त.`);
  return next ? (lang==="hi"?"मूल रिकॉर्ड जाँचें। शून्य आय का अर्थ बिना बिकी उपज नहीं है; बिना जाँची खेपें कुल में शामिल नहीं।":"मूळ नोंदी तपासा. शून्य उत्पन्न म्हणजे न विकलेले उत्पादन नाही; न तपासलेल्या तुकड्या एकूण रकमेत समाविष्ट नाहीत.") : (lang==="hi"?`${nums[0]} कटाई रिकॉर्ड में खेत नहीं या अनुमानित आय शून्य है; तुलना अधूरी हो सकती है।`:`${nums[0]} कापणी नोंदींमध्ये शेत नाही किंवा अपेक्षित उत्पन्न शून्य आहे; तुलना अपूर्ण असू शकते.`);
}