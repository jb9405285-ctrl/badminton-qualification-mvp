"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

export function OrganizerApplicationForm() {
  const { toast } = useToast();
  const [organizationName, setOrganizationName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [applicationId, setApplicationId] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          organizationName,
          contactName,
          contactEmail,
          contactPhone,
          note
        })
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "申请提交失败，请稍后再试。");
      }

      setSubmitted(true);
      setMessage(payload.message);
      setApplicationId(payload.applicationId ?? "");
      toast({
        title: "申请已提交",
        description: "请保存申请编号，后续可自行查询审批进度。",
        tone: "success"
      });
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "申请提交失败，请稍后再试。";
      setMessage(nextMessage);
      toast({
        title: "申请提交失败",
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
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">申请主办方账号</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            正式站不开放自助注册。提交申请后，由平台管理员审核并开通账号。
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-800">
            <p>{message || "申请已提交，等待平台管理员审批。"}</p>
            {applicationId ? (
              <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-700">申请编号</p>
                <p className="mt-2 font-mono text-sm text-slate-900">{applicationId}</p>
                <p className="mt-2 text-xs leading-5 text-emerald-700">
                  请保存这个编号。之后可用“申请编号 + 联系邮箱”在查询页查看审批结果。
                </p>
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                href={
                  applicationId
                    ? `/apply/status?applicationId=${encodeURIComponent(applicationId)}&contactEmail=${encodeURIComponent(contactEmail)}`
                    : "/apply/status"
                }
              >
                查询申请进度
              </Link>
            </div>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="organizationName">主办方名称</Label>
              <Input
                id="organizationName"
                onChange={(event) => setOrganizationName(event.target.value)}
                placeholder="例如：杭州青羽公开赛组委会"
                value={organizationName}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">联系人</Label>
                <Input
                  id="contactName"
                  onChange={(event) => setContactName(event.target.value)}
                  placeholder="请输入联系人姓名"
                  value={contactName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">联系电话</Label>
                <Input
                  id="contactPhone"
                  onChange={(event) => setContactPhone(event.target.value)}
                  placeholder="选填"
                  value={contactPhone}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">联系邮箱</Label>
              <Input
                id="contactEmail"
                inputMode="email"
                onChange={(event) => setContactEmail(event.target.value)}
                placeholder="用于接收开通通知"
                type="email"
                value={contactEmail}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">补充说明</Label>
              <Textarea
                id="note"
                onChange={(event) => setNote(event.target.value)}
                placeholder="可填写赛事类型、预计使用规模或其他说明"
                value={note}
              />
            </div>

            {message ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-risk">
                {message}
              </div>
            ) : null}

            <Button className="w-full" disabled={submitting} size="lg" type="submit">
              {submitting ? "提交中..." : "提交申请"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
