"use client";

import { useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { OrganizerApplicationListItem } from "@/lib/types";

function mapStatus(status: OrganizerApplicationListItem["status"]) {
  if (status === "APPROVED") {
    return { label: "已批准", tone: "safe" as const };
  }

  if (status === "REJECTED") {
    return { label: "已拒绝", tone: "risk" as const };
  }

  return { label: "待审批", tone: "warning" as const };
}

function mapAccountStatus(status: OrganizerApplicationListItem["accountStatus"]) {
  if (status === "ACTIVE") {
    return { label: "账号可用", tone: "safe" as const };
  }

  if (status === "SUSPENDED") {
    return { label: "权限已停用", tone: "risk" as const };
  }

  return null;
}

export function OrganizerApplicationReview({
  initialItems
}: {
  initialItems: OrganizerApplicationListItem[];
}) {
  const { toast } = useToast();
  const [items, setItems] = useState(initialItems);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function copySetupLink(setupPath: string) {
    const fullUrl =
      typeof window === "undefined" ? setupPath : `${window.location.origin}${setupPath}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      toast({
        title: "设密链接已复制",
        description: fullUrl,
        tone: "success"
      });
    } catch {
      toast({
        title: "复制失败",
        description: fullUrl,
        tone: "warning"
      });
    }
  }

  async function handleDecision(id: string, action: "approve" | "reject") {
    setLoadingId(id);

    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          note: notes[id] ?? ""
        })
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "审批失败，请稍后再试。");
      }

      if (action === "approve") {
        setItems((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "APPROVED",
                  reviewedAt: new Date().toISOString(),
                  reviewNote: "已批准并生成首次设密链接。",
                  setupPath: payload.setupPath ?? null,
                  setupTokenExpiresAt: payload.expiresAt ?? null,
                  accountReady: false
                }
              : item
          )
        );
        toast({
          title: "申请已批准",
          description: "申请人可用申请编号和联系邮箱在申请状态页查看设密入口。",
          tone: "success",
          durationMs: 4200
        });
      } else {
        setItems((current) =>
          current.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: "REJECTED",
                  reviewedAt: new Date().toISOString(),
                  reviewNote: notes[id] ?? "已拒绝该申请。"
                }
              : item
          )
        );
        toast({
          title: "申请已拒绝",
          description: payload.message,
          tone: "warning"
        });
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "审批失败，请稍后再试。",
        tone: "error"
      });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleAccountAction(id: string, action: "revoke" | "restore" | "remove") {
    if (
      action === "remove" &&
      !window.confirm("确认删除该主办方权限并从审批页移除？原邮箱会被释放，可重新提交申请。")
    ) {
      return;
    }

    setLoadingId(id);

    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          note: notes[id] ?? ""
        })
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "账号权限更新失败。");
      }

      if (action === "remove") {
        setItems((current) => current.filter((item) => item.id !== id));
        toast({
          title: "权限已删除",
          description: payload.message,
          tone: "warning"
        });
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                reviewedAt: new Date().toISOString(),
                reviewNote: action === "revoke" ? "主办方账号权限已停用。" : "主办方账号权限已恢复。",
                accountStatus: action === "revoke" ? "SUSPENDED" : "ACTIVE"
              }
            : item
        )
      );

      toast({
        title: action === "revoke" ? "权限已停用" : "权限已恢复",
        description: payload.message,
        tone: action === "revoke" ? "warning" : "success"
      });
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "账号权限更新失败。",
        tone: "error"
      });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="grid gap-4">
      {items.length === 0 ? (
        <Card className="border-white/80 bg-white/92 shadow-soft">
          <CardContent className="p-6 text-sm leading-6 text-slate-600">
            当前没有待处理或保留中的主办方申请。
          </CardContent>
        </Card>
      ) : null}
      {items.map((item) => {
        const status = mapStatus(item.status);
        const isPending = item.status === "PENDING";
        const accountStatus = mapAccountStatus(item.accountStatus);
        const canRevoke = item.status === "APPROVED" && item.accountStatus === "ACTIVE";
        const canRestore = item.status === "APPROVED" && item.accountStatus === "SUSPENDED";

        return (
          <Card className="border-white/80 bg-white/92 shadow-soft" key={item.id}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg text-slate-950">{item.organizationName}</CardTitle>
                <p className="font-mono text-xs text-slate-500">申请编号：{item.id}</p>
                <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                  <span>{item.contactName}</span>
                  <span>{item.contactEmail}</span>
                  {item.contactPhone ? <span>{item.contactPhone}</span> : null}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={status.tone}>{status.label}</Badge>
                {accountStatus ? <Badge tone={accountStatus.tone}>{accountStatus.label}</Badge> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.note ? (
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {item.note}
                </div>
              ) : null}

              {isPending ? (
                <>
                  <Textarea
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [item.id]: event.target.value
                      }))
                    }
                    placeholder="可填写审批备注；拒绝时建议说明原因"
                    value={notes[item.id] ?? ""}
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      disabled={loadingId === item.id}
                      onClick={() => handleDecision(item.id, "approve")}
                    >
                      {loadingId === item.id ? "处理中..." : "批准并生成设密链接"}
                    </Button>
                    <Button
                      disabled={loadingId === item.id}
                      onClick={() => handleDecision(item.id, "reject")}
                      variant="outline"
                    >
                      拒绝申请
                    </Button>
                    <Button
                      disabled={loadingId === item.id}
                      onClick={() => handleAccountAction(item.id, "remove")}
                      variant="destructive"
                    >
                      移除记录
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm leading-6 text-slate-600">
                    {item.reviewNote || "该申请已经处理完成。"}
                  </p>
                  {item.setupPath ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                      <p className="font-medium text-slate-950">首次设密链接</p>
                      <p className="mt-2 break-all leading-6 text-slate-600">{item.setupPath}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.setupTokenExpiresAt
                          ? `有效期至 ${new Date(item.setupTokenExpiresAt).toLocaleString("zh-CN")}`
                          : "当前存在一个可用的设密链接"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <Button onClick={() => copySetupLink(item.setupPath!)} size="sm" variant="outline">
                          复制设密链接
                        </Button>
                        <Link
                          className="inline-flex h-9 items-center justify-center rounded-2xl border border-slate-200/90 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          href={item.setupPath}
                          target="_blank"
                        >
                          打开设密页
                        </Link>
                        {canRevoke ? (
                          <Button
                            onClick={() => handleAccountAction(item.id, "revoke")}
                            size="sm"
                            variant="destructive"
                          >
                            停用权限
                          </Button>
                        ) : null}
                        {canRestore ? (
                          <Button onClick={() => handleAccountAction(item.id, "restore")} size="sm">
                            恢复权限
                          </Button>
                        ) : null}
                        <Button
                          onClick={() => handleAccountAction(item.id, "remove")}
                          size="sm"
                          variant="destructive"
                        >
                          删除权限
                        </Button>
                      </div>
                    </div>
                  ) : item.accountReady ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
                      该账号已经完成首次设密，可以直接登录使用。
                      <div className="mt-3 flex flex-wrap gap-3">
                        {canRevoke ? (
                          <Button
                            onClick={() => handleAccountAction(item.id, "revoke")}
                            size="sm"
                            variant="destructive"
                          >
                            停用权限
                          </Button>
                        ) : null}
                        {canRestore ? (
                          <Button onClick={() => handleAccountAction(item.id, "restore")} size="sm">
                            恢复权限
                          </Button>
                        ) : null}
                        <Button
                          onClick={() => handleAccountAction(item.id, "remove")}
                          size="sm"
                          variant="destructive"
                        >
                          删除权限
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
                      当前没有可用的设密链接，可能已经过期或已被使用。
                      <div className="mt-3 flex flex-wrap gap-3">
                        {canRevoke ? (
                          <Button
                            onClick={() => handleAccountAction(item.id, "revoke")}
                            size="sm"
                            variant="destructive"
                          >
                            停用权限
                          </Button>
                        ) : null}
                        {canRestore ? (
                          <Button onClick={() => handleAccountAction(item.id, "restore")} size="sm">
                            恢复权限
                          </Button>
                        ) : null}
                        <Button
                          onClick={() => handleAccountAction(item.id, "remove")}
                          size="sm"
                          variant="destructive"
                        >
                          {item.status === "APPROVED" ? "删除权限" : "移除记录"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
