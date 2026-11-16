import { useT } from "@/lib/i18n";
import produce from "@/assets/reference-growing-vegetables.jpg.asset.json";
import carrots from "@/assets/reference-carrot-harvest.jpg.asset.json";
import potatoes from "@/assets/reference-potatoes.jpg.asset.json";

export const referenceProducePhoto = produce.url;
export const referenceCarrotPhoto = carrots.url;

export function ReferencePhoto({ crop, className = "" }: { crop?: string; className?: string }) {
  const t = useT();
  const source = crop === "胡萝卜" ? carrots.url : crop === "土豆" ? potatoes.url : produce.url;
  return <figure className={`${className.includes("absolute") ? "absolute" : "relative"} overflow-hidden ${className}`}>
    <img src={source} alt={crop === "胡萝卜" ? t("采收后的胡萝卜参考照片", "Reference photograph of harvested carrots", "कटी हुई गाजर की संदर्भ तस्वीर", "काढलेल्या गाजरांचे संदर्भ छायाचित्र") : crop === "土豆" ? t("土豆参考照片", "Reference photograph of potatoes", "आलू की संदर्भ तस्वीर", "बटाट्यांचे संदर्भ छायाचित्र") : t("市场蔬菜参考照片", "Reference photograph of vegetables at market", "बाजार की सब्जियों की संदर्भ तस्वीर", "बाजारातील भाज्यांचे संदर्भ छायाचित्र")} className="h-full w-full object-cover" loading="lazy" />
  </figure>;
}