import { existsSync } from "fs";
import { PassThrough } from "stream";

import PDFDocument from "pdfkit";

import { formatDateTime, formatStatusLabel } from "@/lib/format";

function resolveChineseFontPath() {
  const candidates = [
    "/System/Library/Fonts/PingFang.ttc",
    "/System/Library/Fonts/Hiragino Sans GB.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
    "C:\\Windows\\Fonts\\msyh.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function drawTableRow(
  doc: PDFDocument,
  values: string[],
  widths: number[],
  startX: number,
  y: number
) {
  let x = startX;

  values.forEach((value, index) => {
    doc.rect(x, y, widths[index], 26).stroke("#CBD5E1");
    doc.fontSize(9).fillColor("#0F172A").text(value, x + 6, y + 8, {
      width: widths[index] - 12,
      ellipsis: true
    });
    x += widths[index];
  });
}

export async function createEventPdfReport({
  eventName,
  organizerName,
  exportedAt,
  summary,
  records
}: {
  eventName: string;
  organizerName: string;
  exportedAt: Date;
  summary: {
    total: number;
    passed: number;
    risk: number;
    notFound: number;
    review: number;
  };
  records: Array<{
    athleteNameInput: string;
    matchedLevel: string | null;
    status: string;
    remark: string | null;
    matchedOrganization: string | null;
  }>;
}) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 40
  });
  const stream = new PassThrough();
  const fontPath = resolveChineseFontPath();

  if (fontPath) {
    doc.font(fontPath);
  }

  doc.pipe(stream);

  doc.fontSize(20).fillColor("#0F172A").text("羽毛球赛事资格核验报告", {
    align: "center"
  });
  doc.moveDown(1);
  doc.fontSize(11).fillColor("#334155");
  doc.text(`赛事名称：${eventName}`);
  doc.text(`主办方：${organizerName}`);
  doc.text(`导出时间：${formatDateTime(exportedAt)}`);
  doc.moveDown(1);

  doc.fontSize(13).fillColor("#0F172A").text("核验结果汇总");
  doc.moveDown(0.4);
  doc.fontSize(10).fillColor("#334155");
  doc.text(
    `总人数 ${summary.total} 人，风险名单 ${summary.risk} 人，通过 ${summary.passed} 人，未查到 ${summary.notFound} 人，需复核 ${summary.review} 人。`
  );
  doc.moveDown(1);

  doc.fontSize(13).fillColor("#0F172A").text("风险名单");
  doc.moveDown(0.4);
  const riskRows = records.filter((item) => item.status === "RISK");

  if (riskRows.length === 0) {
    doc.fontSize(10).fillColor("#334155").text("当前未识别到风险名单。");
  } else {
    riskRows.forEach((item, index) => {
      doc
        .fontSize(10)
        .fillColor("#334155")
        .text(
          `${index + 1}. ${item.athleteNameInput} / ${item.matchedLevel ?? "--"} / ${
            item.matchedOrganization ?? "--"
          }`
        );
    });
  }

  doc.moveDown(1);
  doc.fontSize(13).fillColor("#0F172A").text("完整名单结果表");
  doc.moveDown(0.6);

  const startX = 40;
  const widths = [36, 90, 80, 86, 140, 86];
  let currentY = doc.y;

  drawTableRow(doc, ["#", "姓名", "等级", "状态", "单位", "备注"], widths, startX, currentY);
  currentY += 26;

  records.forEach((record, index) => {
    if (currentY > 760) {
      doc.addPage();
      if (fontPath) {
        doc.font(fontPath);
      }
      currentY = 40;
      drawTableRow(doc, ["#", "姓名", "等级", "状态", "单位", "备注"], widths, startX, currentY);
      currentY += 26;
    }

    drawTableRow(
      doc,
      [
        String(index + 1),
        record.athleteNameInput,
        record.matchedLevel ?? "--",
        formatStatusLabel(record.status),
        record.matchedOrganization ?? "--",
        record.remark ?? "--"
      ],
      widths,
      startX,
      currentY
    );
    currentY += 26;
  });

  doc.fontSize(9).fillColor("#64748B");
  doc.text(
    "免责声明：当前数据仅用于演示，暂未接入正式商业授权数据源，实际使用前需核验数据合法性与准确性。",
    40,
    790,
    {
      width: 515,
      align: "center"
    }
  );

  doc.end();

  return stream;
}

export function createVerificationCsv(records: Array<Record<string, string>>) {
  const headers = Object.keys(records[0] ?? {});
  const escapeValue = (value: string) => `"${String(value ?? "").replace(/"/g, '""')}"`;

  const lines = [
    headers.join(","),
    ...records.map((record) => headers.map((header) => escapeValue(record[header])).join(","))
  ];

  return `\uFEFF${lines.join("\n")}`;
}
