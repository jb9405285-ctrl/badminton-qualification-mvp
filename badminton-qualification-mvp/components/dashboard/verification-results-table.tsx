"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatDateTime } from "@/lib/format";

type VerificationRow = {
  id: string;
  athleteNameInput: string;
  matchedAthleteName: string | null;
  matchedLevel: string | null;
  matchedOrganization: string | null;
  status: string;
  remark: string | null;
  queryTime: string;
  isRisk: boolean;
};

export function VerificationResultsTable({ records }: { records: VerificationRow[] }) {
  const pageSize = 10;
  const [page, setPage] = useState(1);
  const [remarks, setRemarks] = useState<Record<string, string>>(
    Object.fromEntries(records.map((record) => [record.id, record.remark ?? ""]))
  );
  const [savingId, setSavingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const pagedRecords = useMemo(
    () => records.slice((page - 1) * pageSize, page * pageSize),
    [page, records]
  );

  async function saveRemark(id: string) {
    setSavingId(id);

    try {
      const response = await fetch(`/api/verification-records/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          remark: remarks[id] ?? ""
        })
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "保存备注失败。");
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "保存备注失败。");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Card className="bg-white/90">
      <CardHeader>
        <CardTitle>完整核验结果</CardTitle>
        <CardDescription>支持分页查看、风险高亮以及逐条填写人工备注。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名单姓名</TableHead>
              <TableHead>匹配结果</TableHead>
              <TableHead>等级</TableHead>
              <TableHead>单位</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>查询时间</TableHead>
              <TableHead>人工备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedRecords.map((record) => (
              <TableRow
                className={record.isRisk ? "bg-risk/5" : undefined}
                key={record.id}
              >
                <TableCell className="font-medium">{record.athleteNameInput}</TableCell>
                <TableCell>{record.matchedAthleteName ?? "未查到"}</TableCell>
                <TableCell>{record.matchedLevel ?? "--"}</TableCell>
                <TableCell>{record.matchedOrganization ?? "--"}</TableCell>
                <TableCell>
                  <StatusBadge status={record.status} />
                </TableCell>
                <TableCell>{formatDateTime(record.queryTime)}</TableCell>
                <TableCell className="min-w-[280px]">
                  <div className="space-y-2">
                    <Textarea
                      className="min-h-[88px]"
                      onChange={(event) =>
                        setRemarks((current) => ({ ...current, [record.id]: event.target.value }))
                      }
                      value={remarks[record.id] ?? ""}
                    />
                    <Button
                      disabled={savingId === record.id}
                      onClick={() => void saveRemark(record.id)}
                      size="sm"
                      variant="outline"
                    >
                      {savingId === record.id ? "保存中..." : "保存备注"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <PaginationControls currentPage={page} onPageChange={setPage} totalPages={totalPages} />
      </CardContent>
    </Card>
  );
}
