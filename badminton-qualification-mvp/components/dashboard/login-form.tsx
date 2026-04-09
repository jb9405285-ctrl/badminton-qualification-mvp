"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function LoginForm({
  sampleEmail,
  samplePassword,
  allowSampleFill = false,
  applyHref
}: {
  sampleEmail?: string;
  samplePassword?: string;
  allowSampleFill?: boolean;
  applyHref?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitLogin(nextEmail: string, nextPassword: string) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: nextEmail,
          password: nextPassword
        })
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "登录失败，请检查账号或密码。");
      }

      toast({
        title: "登录成功",
        description: "已进入主办方工作台。",
        tone: "success"
      });

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "登录失败，请稍后再试。");
      toast({
        title: "登录失败",
        description: submitError instanceof Error ? submitError.message : "请稍后再试。",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitLogin(email, password);
  }

  function fillSampleAccount() {
    if (!sampleEmail || !samplePassword) {
      return;
    }

    setEmail(sampleEmail);
    setPassword(samplePassword);
    setError("");
    toast({
      title: "已填充示例账号",
      description: "可直接提交登录。",
      tone: "success"
    });
  }

  function handleForgotPassword() {
    toast({
      title: "忘记密码",
      description: "请联系平台管理员重置账号。",
      tone: "warning"
    });
  }

  return (
    <Card className="overflow-hidden border-white/80 bg-white/92 shadow-panel">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">主办方登录</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">使用主办方账号进入工作台。</p>
          </div>
        </div>

        {allowSampleFill ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button disabled={loading} onClick={fillSampleAccount} size="sm" type="button" variant="outline">
              填充示例账号
            </Button>
            <p className="text-sm text-slate-500">表单默认保持空状态。</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            没有账号的主办方需要先提交申请，审批通过后再完成首次设密。
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              autoComplete="email"
              id="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="请输入登录邮箱"
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                autoComplete="current-password"
                className="pr-12"
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
                className={cn(
                  "absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition hover:text-slate-950"
                )}
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-start gap-3 text-sm">
            <a
              className="text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline"
              href="mailto:contact@badminton-qualification-mvp.com?subject=%E5%BF%98%E8%AE%B0%E5%AF%86%E7%A0%81"
              onClick={(event) => {
                event.preventDefault();
                handleForgotPassword();
              }}
            >
              忘记密码
            </a>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-risk">
              {error}
            </div>
          ) : null}

          <Button className="w-full" disabled={loading} size="lg" type="submit">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            {loading ? "登录中..." : "主办方登录"}
          </Button>

          {applyHref ? (
            <Link
              className="block text-center text-sm text-slate-600 underline-offset-4 transition hover:text-slate-950 hover:underline"
              href={applyHref}
            >
              没有账号，申请开通
            </Link>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
