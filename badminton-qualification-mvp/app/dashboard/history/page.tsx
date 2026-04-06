import Link from "next/link";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { getHistoryList } from "@/lib/services/dashboard-service";

export default async function HistoryPage() {
  const batches = await getHistoryList();

  return batches.length === 0 ? (
    <EmptyState
      title="暂无核验历史"
      description="上传过的所有名单批次都会在这里留痕，便于后续追溯与复盘。"
    />
  ) : (
    <Card className="bg-white/90">
      <CardHeader>
        <CardTitle>核验历史</CardTitle>
        <CardDescription>按上传时间倒序展示每一场赛事的名单处理记录。</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>文件名</TableHead>
              <TableHead>赛事</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>总人数</TableHead>
              <TableHead>风险人数</TableHead>
              <TableHead>上传时间</TableHead>
              <TableHead>查看</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>{batch.originalFileName}</TableCell>
                <TableCell>{batch.event.name}</TableCell>
                <TableCell>
                  <StatusBadge status={batch.status} />
                </TableCell>
                <TableCell>{batch.totalRows}</TableCell>
                <TableCell>{batch.riskRows}</TableCell>
                <TableCell>{formatDateTime(batch.createdAt)}</TableCell>
                <TableCell>
                  <Link className="text-primary hover:underline" href={`/dashboard/events/${batch.eventId}`}>
                    查看赛事详情
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
