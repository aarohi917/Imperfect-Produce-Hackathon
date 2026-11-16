import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { SettingsControl } from "@/components/SettingsControl";
import { ApprovalFlow } from "@/components/ApprovalFlow";
import { useT } from "@/lib/i18n";
import photo from "@/assets/home-weighing.jpg";
import { useMe } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "丑蔬 Imperfect Produce — 有机农场采收记录 | Organic harvest records" },
    { name: "description", content: "农户拍照上报，核对员核实数字，核对员收到采收通知。Farmers report, the checker confirms the numbers, Checkers receive harvest alerts." },
    { property: "og:title", content: "丑蔬 Imperfect Produce — 有机农场采收记录" },
    { property: "og:description", content: "农户拍照上报，核对员核实数字，核对员收到采收通知。Farmers report, the checker confirms the numbers, Checkers receive harvest alerts." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Index,
});

function Index() {
  const t = useT();
  const { data: me } = useMe();
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Brand />
        <SettingsControl />
      </header>
      <section className="relative mx-auto mb-10 max-w-6xl overflow-hidden">
        <img src={photo} alt={t("农户在棚里称一筐青菜和胡萝卜", "Farmer weighing a crate of greens and carrots in the shed")} width={1280} height={960} className="h-[540px] w-full object-cover md:h-[600px]" />
        <div className="absolute inset-0 bg-foreground/50" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-12 text-primary-foreground md:px-12">
          <h1 className="max-w-xl text-4xl md:text-5xl">{t("丑蔬", "Imperfect Produce", "इम्परफेक्ट प्रोड्यूस", "इम्परफेक्ट प्रोड्यूस")}</h1>
          <p className="mt-4 max-w-xl text-lg">{t("农户上报，核对员核实数字，核对通过的采收进入正式记录。", "Farmers report, the checker confirms the numbers, and approved harvests become reliable records.")}</p>
          <div className="mt-6"><Button asChild size="lg"><Link to={me ? me.isManagement ? "/dashboard" : "/overview" : "/auth"}>{t("开始使用", "Get started")}<ArrowRight /></Link></Button></div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="mb-4 text-2xl text-primary">{t("谁来核对？核对后会怎样？", "Who checks it, and what happens next?")}</h2>
        <ApprovalFlow />
      </section>
    </div>
  );
}
