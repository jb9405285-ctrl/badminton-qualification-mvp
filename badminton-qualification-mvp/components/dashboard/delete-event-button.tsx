"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

type DeleteEventButtonProps = {
  eventId: string;
  eventName: string;
  batchCount: number;
};

export function DeleteEventButton({ eventId, eventName, batchCount }: DeleteEventButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const detail =
      batchCount > 0
        ? `这会同时删除该赛事下的 ${batchCount} 个上传批次、核验结果和导出依据。`
        : "该赛事当前没有上传批次。";

    if (!window.confirm(`确认删除赛事“${eventName}”？\n${detail}\n删除后不可恢复。`)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE"
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.message || "赛事删除失败。");
      }

      toast({
        title: "赛事已删除",
        description: payload.message,
        tone: "success"
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "赛事删除失败。",
        tone: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button disabled={loading} onClick={handleDelete} size="sm" type="button" variant="destructive">
      {loading ? "删除中..." : "删除赛事"}
    </Button>
  );
}
