"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

export function SetupAccountForm({
  token,
  initialName,
  organizationName
}: {
  token: string;
  initialName: string;
  organizationName: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致。");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/auth/setup-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token,
          name,
          password
        })
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "密码设置失败，请重新获取设密链接。");
      }

      toast({
        title: "密码设置完成",
        description: "现在可以使用正式账号登录。",
        tone: "success"
      });

      router.push("/login");
      router.refresh();
    } catch (submitError) {
      const nextMessage =
        submitError instanceof Error ? submitError.message : "密码设置失败，请重新获取设密链接。";
      setError(nextMessage);
      toast({
        title: "设密失败",
        description: nextMessage,
        tone: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="border-white/80 bg-white/92 shadow-panel">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">完成首次设密</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            账号已为 {organizationName} 开通。完成设密后即可进入正式工作台。
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input id="name" onChange={(event) => setName(event.target.value)} value={name} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">设置密码</Label>
            <Input
              autoComplete="new-password"
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 8 位"
              type="password"
              value={password}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <Input
              autoComplete="new-password"
              id="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="再次输入密码"
              type="password"
              value={confirmPassword}
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-risk">
              {error}
            </div>
          ) : null}

          <Button className="w-full" disabled={submitting} size="lg" type="submit">
            {submitting ? "提交中..." : "完成设密"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
