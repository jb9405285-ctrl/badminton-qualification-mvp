"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { EventFormValues } from "@/lib/types";

export function CreateEventForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<EventFormValues>({
    name: "",
    organizerName: "",
    eventDate: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "创建赛事失败。");
      }

      toast({
        title: "赛事已创建",
        description: payload.message || "现在可以继续上传名单并查看核验结果。",
        tone: "success"
      });
      setForm({
        name: "",
        organizerName: "",
        eventDate: "",
        notes: ""
      });
      router.push(`/dashboard/events/${payload.eventId}`);
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "创建赛事失败。";
      setError(message);
      toast({
        title: "创建失败",
        description: message,
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="dashboard-panel border-white/80">
      <CardHeader className="pb-4">
        <CardTitle>创建赛事</CardTitle>
        <CardDescription>先创建赛事，再把上传批次、核验结果和导出报告都挂到同一个赛事对象下。</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
          <div className="dashboard-inset space-y-2 p-4 md:col-span-2">
            <Label htmlFor="event-name">赛事名称</Label>
            <Input
              id="event-name"
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="例如：2026 春季羽毛球公开赛"
              value={form.name}
            />
          </div>
          <div className="dashboard-inset space-y-2 p-4">
            <Label htmlFor="organizer-name">主办方名称</Label>
            <Input
              id="organizer-name"
              onChange={(event) =>
                setForm((current) => ({ ...current, organizerName: event.target.value }))
              }
              placeholder="例如：XX 羽毛球俱乐部"
              value={form.organizerName}
            />
          </div>
          <div className="dashboard-inset space-y-2 p-4">
            <Label htmlFor="event-date">比赛日期</Label>
            <Input
              id="event-date"
              onChange={(event) => setForm((current) => ({ ...current, eventDate: event.target.value }))}
              type="date"
              value={form.eventDate}
            />
          </div>
          <div className="dashboard-inset space-y-2 p-4 md:col-span-2">
            <Label htmlFor="event-notes">备注</Label>
            <Textarea
              id="event-notes"
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="填写赛事分组规则、资格说明或本次核验目的。"
              value={form.notes}
            />
          </div>
          <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
            {error ? <p className="text-sm text-risk">{error}</p> : <div />}
            <Button disabled={loading} type="submit">
              {loading ? "创建中..." : "创建赛事"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
