import { formatDate, translate, type Lang } from "./localization";
import type { UIMessage } from "ai";

export function messageText(message: UIMessage) {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("\n");
}

export function defaultChatTitle(started: string, topic: string, lang: Lang, timeZone = "UTC") {
  const date = formatDate(started,{language:lang,currency:"CNY",timeZone});
  const topics = [
    {pattern:/how are my crops|作物.*怎样|作物.*情况/i,zh:"作物情况",en:"Crop progress"},
    {pattern:/what farm preference|remember|记住|记忆/i,zh:"农场记忆",en:"Farm memory"},
    {pattern:/which crop earns|哪种作物最赚钱/i,zh:"作物收益",en:"Crop earnings"},
    {pattern:/毛利|利润|profit|margin|लाभ|नफा/i,zh:"利润与毛利率",en:"Profit Margins"},
    {pattern:/蚜虫|aphid|माहू|मावा/i,zh:"有机防治蚜虫",en:"Organic Aphid Control"},
    {pattern:/灌溉|浇水|irrigat|watering|सिंचाई|सिंचन/i,zh:"灌溉与用水",en:"Irrigation"},
    {pattern:/土壤|soil|मिट्टी|माती/i,zh:"土壤管理",en:"Soil Management"},
    {pattern:/轮作|rotation|फसल चक्र|फेरपालट/i,zh:"作物轮作",en:"Crop Rotation"},
    {pattern:/累|压力|exhaust|stress|थक|तनाव|ताण/i,zh:"劳累与压力",en:"Fatigue and Stress"},
    {pattern:/成本|cost|लागत|खर्च/i,zh:"种植成本",en:"Growing Costs"},
  ];
  const match=topics.find(item=>item.pattern.test(topic));
  const clean=(match?translate(lang,match.zh,match.en):(topic.split(/[。！？!?\n]/)[0]??topic)).replace(/\s+/g," ").trim().replace(/[?？。.!！]+$/,"");
  return `${date} – ${clean.slice(0,60)||translate(lang,"新对话","New conversation")}${clean.length>60?"…":""}`;
}
export function displayChatTitle(thread: {title:string;title_custom?:boolean;auto_topic?:string|null;created_at:string},lang:Lang,timeZone:string) {
  return thread.title_custom ? thread.title : defaultChatTitle(thread.created_at,thread.auto_topic??"",lang,timeZone);
}
