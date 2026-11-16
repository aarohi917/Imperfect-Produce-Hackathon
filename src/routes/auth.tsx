import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/Brand";
import { SettingsControl } from "@/components/SettingsControl";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/auth";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Imperfect Produce — Register or sign in" },
    { name: "description", content: "Create your Imperfect Produce account or sign in to your farm workspace." },
    { property: "og:title", content: "Imperfect Produce — Register or sign in" },
    { property: "og:description", content: "Access your harvest records, field tools, and farmer's guide." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const t = useT();
  const navigate = useNavigate();
  const { data: me } = useMe();
  const [register, setRegister] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (register) {
        const result = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin },
        });
        if (result.error) throw result.error;
        setPassword("");
        if (!result.data.session) {
          setConfirmation(true);
          return;
        }
      } else {
        const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) throw result.error;
      }
      await navigate({ to: "/demo", replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("操作失败，请重试", "Something went wrong, please try again"));
    } finally { setBusy(false); }
  }

  if (me) return <Navigate to={me.isManagement ? "/dashboard" : "/overview"} replace />;

  return <div className="min-h-screen bg-background">
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5"><Brand /><SettingsControl /></header>
    <main className="mx-auto max-w-md px-6 pb-16 pt-10 sm:pt-20">
      <Button asChild variant="ghost" size="sm" className="mb-8"><Link to="/"><ArrowLeft />{t("返回首页", "Go home")}</Link></Button>
      <h1 className="text-3xl">{register ? t("创建账户", "Create account") : t("欢迎回来。", "Welcome back.")}</h1>
      {confirmation ? <div role="status" className="mt-6 border-l-2 border-primary pl-4"><p>{t("请查看邮箱并点击确认链接。", "Check your email and click the confirmation link.")}</p></div> :
        <form onSubmit={submit} className="mt-8 space-y-5">
          {register && <div className="space-y-2"><Label htmlFor="name">{t("姓名", "Name")}</Label><Input id="name" autoComplete="name" required maxLength={100} value={name} onChange={e => setName(e.target.value)} disabled={busy} /></div>}
          <div className="space-y-2"><Label htmlFor="email">{t("邮箱", "Email")}</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></div>
          <div className="space-y-2"><Label htmlFor="password">{t("密码", "Password")}</Label><Input id="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={register ? 6 : undefined} required value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>{busy && <LoaderCircle className="animate-spin motion-reduce:animate-none" />}{busy ? t("请稍候…", "Please wait…") : register ? t("创建账户", "Create account") : t("登录", "Sign in")}</Button>
        </form>}
      <Button variant="link" className="mt-5 h-auto whitespace-normal px-0 text-left" disabled={busy} onClick={() => { setRegister(!register); setConfirmation(false); setError(""); setPassword(""); }}>{register ? t("已有账户？登录", "Already have an account? Sign in") : t("第一次来？创建账户", "New here? Create an account")}</Button>
    </main>
  </div>;
}
