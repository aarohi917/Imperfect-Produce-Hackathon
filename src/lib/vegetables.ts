import { formatMoney, translate, type Lang } from "./localization";
/** 标准蔬菜列表（与数据库校验一致）；所有重量单位为公斤。 */
export const VEGETABLES = ["白菜","菠菜","青菜","生菜","芹菜","韭菜","西兰花","花菜","胡萝卜","白萝卜","土豆","红薯","洋葱","大蒜","生姜","番茄","黄瓜","茄子","辣椒","南瓜","冬瓜","豆角","莲藕"] as const;

const ALIASES: Record<string, string> = {
  西红柿: "番茄", 马铃薯: "土豆", 洋芋: "土豆", 地瓜: "红薯", 番薯: "红薯", 青椒: "辣椒", 尖椒: "辣椒", 萝卜: "白萝卜", 菜花: "花菜", 花椰菜: "花菜", 大白菜: "白菜", 小白菜: "青菜", 上海青: "青菜", 四季豆: "豆角", 姜: "生姜", 蒜: "大蒜",
  carrot: "胡萝卜", tomato: "番茄", potato: "土豆", cabbage: "白菜", cucumber: "黄瓜", eggplant: "茄子", pepper: "辣椒", onion: "洋葱", garlic: "大蒜", spinach: "菠菜", lettuce: "生菜", broccoli: "西兰花", pumpkin: "南瓜",
};

export function normalizeVegetable(name: string): string {
  const raw = name.trim();
  const low = raw.toLowerCase().replace(/(es|s)$/, "");
  if ((VEGETABLES as readonly string[]).includes(raw)) return raw;
  const direct = ALIASES[raw]; if (direct) return direct;
  const alias = ALIASES[low]; if (alias) return alias;
  return VEGETABLES.find((v) => raw.includes(v)) ?? "";
}

export const yuan = (v: number, digits = 0, currency = "CNY", lang: Lang = "zh") => formatMoney(v, currency, lang, digits);
export const destLabel = (d: string, lang: Lang = "zh") => d === "factory" ? translate(lang,"工厂","Factory") : translate(lang,"市场","Market");

const EN: Record<string, string> = { 白菜: "Napa cabbage", 菠菜: "Spinach", 青菜: "Bok choy", 生菜: "Lettuce", 芹菜: "Celery", 韭菜: "Chinese chives", 西兰花: "Broccoli", 花菜: "Cauliflower", 胡萝卜: "Carrot", 白萝卜: "Daikon radish", 土豆: "Potato", 红薯: "Sweet potato", 洋葱: "Onion", 大蒜: "Garlic", 生姜: "Ginger", 番茄: "Tomato", 黄瓜: "Cucumber", 茄子: "Eggplant", 辣椒: "Chili pepper", 南瓜: "Pumpkin", 冬瓜: "Winter melon", 豆角: "Green beans", 莲藕: "Lotus root" };
const HI = ["चीनी पत्तागोभी","पालक","बोक चॉय","सलाद पत्ता","अजमोद","चीनी चाइव्स","ब्रोकली","फूलगोभी","गाजर","सफेद मूली","आलू","शकरकंद","प्याज","लहसुन","अदरक","टमाटर","खीरा","बैंगन","मिर्च","कद्दू","पेठा","हरी फलियाँ","कमल ककड़ी"];
const MR = ["चिनी कोबी","पालक","बोक चॉय","लेट्यूस","सेलरी","चिनी पात","ब्रोकोली","फ्लॉवर","गाजर","पांढरा मुळा","बटाटा","रताळे","कांदा","लसूण","आले","टोमॅटो","काकडी","वांगी","मिरची","भोपळा","कोहळा","फरसबी","कमळाचा कंद"];
export function vegLabel(v: string, lang: Lang = "zh") {
  if(lang === "zh") return v;
  if(lang === "en") return EN[v] ?? v;
  const index = VEGETABLES.findIndex(c => c === v);
  return (lang === "hi" ? HI[index] : MR[index]) ?? EN[v] ?? v;
}
export const vegEnglish = EN;
