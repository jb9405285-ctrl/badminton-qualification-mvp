"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import type { OrganizerApplicationStatusLookup } from "@/lib/types";

function mapStatusTone(status: OrganizerApplicationStatusLookup["status"]) {
  if (status === "APPROVED") {
    return { label: "已批准", tone: "safe" as const };
  }

  if (status === "REJECTED") {
    return { label: "已拒绝", tone: "risk" as const };
  }

  return { label: "待审批", tone: "warning" as const };
}

function formatDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString("zh-CN");
}

export function ApplicationStatusForm({
  initialApplicationId = "",
  initialContactEmail = ""
}: {
  initialApplicationId?: string;
  initialContactEmail?: string;
}) {
  const { toast } = useToast();
  const autoRequested = useRef(false);
  const [applicationId, setApplicationId] = useState(initialApplicationId);
  const [contactEmail, setContactEmail] = useState(initialContactEmail);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<OrganizerApplicationStatusLookup | null>(null);

  async function queryStatus(nextApplicationId: string, nextContactEmail: string) {
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/applications/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          applicationId: nextApplicationId,
          contactEmail: nextContactEmail
        })
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "查询失败，请稍后再试。");
      }

      setResult(payload.application);
      setMessage(payload.message);
    } catch (error) {
      const nextMessage = error instanceof Error ? error.message : "查询失败，请稍后再试。";
      setResult(null);
      setMessage(nextMessage);
      toast({
        title: "查询失败",
        description: nextMessage,
        tone: "error"
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await queryStatus(applicationId, contactEmail);
  }

  useEffect(() => {
    if (!initialApplicationId || !initialContactEmail || autoRequested.current) {
      return;
    }

    autoRequested.current = true;
    void queryStatus(initialApplicationId, initialContactEmail);
  }, [initialApplicationId, initialContactEmail]);

  const status = result ? mapStatusTone(result.status) : null;
  const createdAtLabel = result ? formatDateTime(result.createdAt) : null;
  const reviewedAtLabel = result ? formatDateTime(result.reviewedAt) : null;
  const setupExpiresAtLabel = result ? formatDateTime(result.setupTokenExpiresAt) : null;

  return (
    <Card className="border-white/80 bg-white/92 shadow-panel" id="application-status">
      <CardContent className="space-y-6 p-6 sm:p-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">查询申请进度</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            输入申请编号和联系邮箱后，可查看审批状态；已批准的申请会在这里显示首次设密入口。
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="applicationId">申请编号</Label>
            <Input
              id="applicationId"
              onChange={(event) => setApplicationId(event.target.value)}
              placeholder="例如：cmxxxxxxxxxxxxxxxx"
              value={applicationId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="statusContactEmail">联系邮箱</Label>
            <Input
              id="statusContactEmail"
              inputMode="email"
              onChange={(event) => setContactEmail(event.target.value)}
              placeholder="请输入提交申请时填写的邮箱"
              type="email"
              value={contactEmail}
            />
          </div>

          {message && !result ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-risk">
              {message}
            </div>
          ) : null}

          <Button className="w-full" disabled={submitting} size="lg" type="submit">
            {submitting ? "查询中..." : "查询申请进度"}
          </Button>
        </form>

        {result ? (
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-slate-950">{result.organizationName}</p>
                <p className="font-mono text-sm text-slate-500">申请编号：{result.id}</p>
              </div>
              {status ? <Badge tone={status.tone}>{status.label}</Badge> : null}
            </div>

            {message ? <p className="text-sm leading-6 text-slate-700">{message}</p> : null}

            <div className="grid gap-2 text-sm leading-6 text-slate-600">
              <p>联系邮箱：{result.contactEmail}</p>
              {createdAtLabel ? <p>提交时间：{createdAtLabel}</p> : null}
              {reviewedAtLabel ? <p>处理时间：{reviewedAtLabel}</p> : null}
              {result.reviewNote ? <p>处理备注：{result.reviewNote}</p> : null}
            </div>

            {result.status === "APPROVED" && result.setupPath ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                <p className="font-medium text-emerald-950">首次设密入口已准备好</p>
                <p className="mt-2 leading-6">
                  请先完成首次设密，设密完成后再回到登录页进入正式工作台。
                </p>
                {setupExpiresAtLabel ? <p className="mt-2 text-xs">有效期至 {setupExpiresAtLabel}</p> : null}
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
                    href={result.setupPath}
                  >
                    去完成首次设密
                  </Link>
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    href="/login"
                  >
                    返回登录页
                  </Link>
                </div>
              </div>
            ) : null}

            {result.status === "APPROVED" && result.accountReady ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                <p className="font-medium text-emerald-950">
                  {result.accountStatus === "SUSPENDED" ? "账号已开通，但当前权限已停用" : "账号已开通，可以直接登录"}
                </p>
                <p className="mt-2 leading-6">
                  {result.accountStatus === "SUSPENDED"
                    ? "请联系平台管理员恢复权限后再使用。"
                    : "如果你已经完成首次设密，现在可以直接进入登录页。"}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    href="/login"
                  >
                    前往登录
                  </Link>
                </div>
              </div>
            ) : null}

            {result.status === "APPROVED" && !result.setupPath && !result.accountReady ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                当前没有可用的设密链接，可能已经过期。请联系平台管理员重新生成后再继续。
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
