"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { EventEditableSummary, EventFormValues } from "@/lib/types";

type EditEventFormProps = {
  event: EventEditableSummary;
  initiallyOpen?: boolean;
  triggerLabel?: string;
};

function toFormValues(event: EventEditableSummary): EventFormValues {
  return {
    name: event.name,
    organizerName: event.organizerName,
    eventDate: event.eventDate.slice(0, 10),
    notes: event.notes ?? ""
  };
}

export function EditEventForm({
  event,
  initiallyOpen = false,
  triggerLabel = "编辑赛事"
}: EditEventFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [form, setForm] = useState<EventFormValues>(() => toFormValues(event));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setForm(toFormValues(event));
  }, [event]);

  async function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "赛事更新失败。");
      }

      toast({
        title: "赛事信息已更新",
        description: "赛事名称、主办方、比赛日期和备注已同步刷新。",
        tone: "success"
      });
      router.refresh();
      setIsOpen(initiallyOpen);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "赛事更新失败。";
      setError(message);
      toast({
        title: "保存失败",
        description: message,
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {!isOpen ? (
        <Button onClick={() => setIsOpen(true)} size="sm" variant="outline">
          {triggerLabel}
        </Button>
      ) : null}

      {isOpen ? (
        <div className="dashboard-inset space-y-4 rounded-3xl p-4 md:p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">编辑赛事信息</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                修改后，赛事列表、批次留痕、导出报告和赛事详情会统一使用最新信息。
              </p>
            </div>
            {!initiallyOpen ? (
              <Button disabled={loading} onClick={() => setIsOpen(false)} size="sm" variant="ghost">
                收起
              </Button>
            ) : null}
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`event-name-${event.id}`}>赛事名称</Label>
              <Input
                id={`event-name-${event.id}`}
                onChange={(inputEvent) =>
                  setForm((current) => ({ ...current, name: inputEvent.target.value }))
                }
                placeholder="例如：2026 春季羽毛球公开赛"
                value={form.name}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`organizer-name-${event.id}`}>主办方名称</Label>
              <Input
                id={`organizer-name-${event.id}`}
                onChange={(inputEvent) =>
                  setForm((current) => ({ ...current, organizerName: inputEvent.target.value }))
                }
                placeholder="例如：星羽羽毛球俱乐部"
                value={form.organizerName}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`event-date-${event.id}`}>比赛日期</Label>
              <Input
                id={`event-date-${event.id}`}
                onChange={(inputEvent) =>
                  setForm((current) => ({ ...current, eventDate: inputEvent.target.value }))
                }
                type="date"
                value={form.eventDate}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={`event-notes-${event.id}`}>备注</Label>
              <Textarea
                id={`event-notes-${event.id}`}
                onChange={(inputEvent) =>
                  setForm((current) => ({ ...current, notes: inputEvent.target.value }))
                }
                placeholder="填写赛事分组、资格口径、导出用途或主办方内部备注。"
                value={form.notes}
              />
            </div>

            <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                {error ? <p className="text-sm text-risk">{error}</p> : null}
                {event.updatedAt ? (
                  <p className="text-xs text-muted-foreground">最近更新：{event.updatedAt.slice(0, 10)}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                {!initiallyOpen ? (
                  <Button
                    disabled={loading}
                    onClick={() => {
                      setForm(toFormValues(event));
                      setError("");
                      setIsOpen(false);
                    }}
                    type="button"
                    variant="ghost"
                  >
                    取消
                  </Button>
                ) : null}
                <Button disabled={loading} type="submit">
                  {loading ? "保存中..." : "保存赛事信息"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
