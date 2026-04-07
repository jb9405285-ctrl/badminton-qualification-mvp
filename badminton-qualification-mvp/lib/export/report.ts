import { existsSync } from "fs";
import { PassThrough } from "stream";

import PDFDocument from "pdfkit";

import { formatDate, formatDateTime, formatStatusLabel } from "@/lib/format";

function resolveChineseFontPath() {
  const candidates = [
    "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
    "/Library/Fonts/Arial Unicode.ttf",
    "/System/Library/Fonts/Supplemental/NISC18030.ttf",
    "C:\\Windows\\Fonts\\msyh.ttf",
    "C:\\Windows\\Fonts\\simhei.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttf",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.otf"
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

function drawTableRow(
  doc: PDFKit.PDFDocument,
  values: string[],
  widths: number[],
  startX: number,
  y: number,
  options?: {
    header?: boolean;
    height?: number;
    fillColor?: string;
    textColor?: string;
  }
) {
  let x = startX;
  const height = options?.height ?? 26;
  const fillColor = options?.fillColor ?? (options?.header ? "#F1F5F9" : "#FFFFFF");
  const textColor = options?.textColor ?? (options?.header ? "#334155" : "#0F172A");

  values.forEach((value, index) => {
    doc.rect(x, y, widths[index], height).fillAndStroke(fillColor, "#CBD5E1");
    doc.fontSize(options?.header ? 8 : 8.5).fillColor(textColor).text(value, x + 6, y + 8, {
      width: widths[index] - 12,
      ellipsis: true
    });
    x += widths[index];
  });
}

function drawSectionTitle(doc: PDFKit.PDFDocument, title: string, description?: string) {
  doc.fontSize(13).fillColor("#0F172A").text(title);

  if (description) {
    doc.moveDown(0.35);
    doc.fontSize(9).fillColor("#64748B").text(description, {
      width: 515,
      lineGap: 2
    });
  }

  doc.moveDown(0.65);
}

function drawFooter(doc: PDFKit.PDFDocument) {
  doc.fontSize(8).fillColor("#64748B");
  doc.text(
    "免责声明：当前版本同时使用公开接口与本地数据源，暂未接入商业授权数据源，正式使用前请人工复核并确认数据适用性。",
    40,
    790,
    {
      width: 515,
      align: "center"
    }
  );
}

function addReportPage(doc: PDFKit.PDFDocument, fontPath?: string) {
  drawFooter(doc);
  doc.addPage();

  if (fontPath) {
    doc.font(fontPath);
  }

  return 40;
}

export async function createEventPdfReport({
  eventName,
  organizerName,
  eventDate,
  eventNotes,
  batch,
  exportedAt,
  summary,
  records
}: {
  eventName: string;
  organizerName: string;
  eventDate: Date;
  eventNotes?: string | null;
  batch: {
    id: string;
    fileName: string;
    uploadedAt: Date;
    totalRows: number;
    processedRows: number;
    riskRows: number;
    unresolvedRows: number;
  };
  exportedAt: Date;
  summary: {
    total: number;
    passed: number;
    risk: number;
    notFound: number;
    review: number;
  };
  records: Array<{
    rowIndex: number | null;
    athleteNameInput: string;
    matchedAthleteName: string | null;
    matchedLevel: string | null;
    matchedGender: string | null;
    matchedRegion: string | null;
    status: string;
    remark: string | null;
    matchedOrganization: string | null;
    matchedSourceName: string | null;
    isRisk: boolean;
    queryTime: Date;
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

  doc.rect(40, 40, 515, 86).fill("#0F172A");
  doc.fontSize(21).fillColor("#FFFFFF").text("羽毛球赛事资格核验报告", 60, 62, {
    width: 320
  });
  doc.fontSize(9).fillColor("#CBD5E1").text("Qualification Verification Report", 60, 92);
  doc
    .fontSize(9)
    .fillColor("#CBD5E1")
    .text(`导出时间：${formatDateTime(exportedAt)}`, 370, 66, { width: 160, align: "right" });

  doc.y = 148;
  drawSectionTitle(doc, "赛事与批次信息", "本报告只统计当前导出的这一次名单批次，不合并同一赛事下的历史上传结果。");
  doc.fontSize(10).fillColor("#334155");
  doc.text(`赛事名称：${eventName}`);
  doc.text(`主办方：${organizerName}`);
  doc.text(`比赛日期：${formatDate(eventDate)}`);
  doc.text(`名单文件：${batch.fileName}`);
  doc.text(`批次编号：${batch.id}`);
  doc.text(`上传时间：${formatDateTime(batch.uploadedAt)}`);
  doc.text(`名单行数：${batch.totalRows}；已核验：${batch.processedRows}；未查到/需复核：${batch.unresolvedRows}`);
  if (eventNotes) {
    doc.text(`赛事备注：${eventNotes}`, { width: 515 });
  }
  doc.moveDown(1);

  drawSectionTitle(doc, "核验结果汇总");
  const summaryCards = [
    ["总人数", summary.total],
    ["风险名单", summary.risk],
    ["通过", summary.passed],
    ["未查到", summary.notFound],
    ["需复核", summary.review]
  ] as const;
  let cardX = 40;
  const cardY = doc.y;
  summaryCards.forEach(([label, value]) => {
    doc.roundedRect(cardX, cardY, 96, 48, 10).fillAndStroke("#F8FAFC", "#CBD5E1");
    doc.fontSize(8).fillColor("#64748B").text(label, cardX + 10, cardY + 10, { width: 76 });
    doc.fontSize(16).fillColor(label === "风险名单" ? "#DC2626" : "#0F172A").text(String(value), cardX + 10, cardY + 25, {
      width: 76
    });
    cardX += 104;
  });
  doc.y = cardY + 68;

  const conclusionColor = summary.risk > 0 ? "#FEF2F2" : "#ECFDF5";
  const conclusionBorder = summary.risk > 0 ? "#FCA5A5" : "#86EFAC";
  const conclusionText = summary.risk > 0 ? "#991B1B" : "#166534";
  const conclusion =
    summary.risk > 0
      ? `本次名单发现 ${summary.risk} 名二级及以上风险人员，建议主办方在报名资格确认前逐一核对身份与等级信息。`
      : "本次名单未发现二级及以上风险人员；未查到记录仍建议结合赛事规则保留人工复核。";

  const conclusionY = doc.y;
  doc.roundedRect(40, conclusionY, 515, 46, 12).fillAndStroke(conclusionColor, conclusionBorder);
  doc.fontSize(10).fillColor(conclusionText).text(conclusion, 56, conclusionY + 14, {
    width: 483,
    lineGap: 2
  });
  doc.y = conclusionY + 66;

  drawSectionTitle(doc, "二级及以上风险名单", "以下名单为当前批次中被识别为风险的人员。");
  const riskRows = records.filter((item) => item.isRisk || item.status === "RISK");

  if (riskRows.length === 0) {
    doc.fontSize(10).fillColor("#334155").text("当前批次未识别到二级及以上风险名单。");
  } else {
    const riskWidths = [34, 82, 82, 82, 125, 110];
    let riskY = doc.y;
    drawTableRow(doc, ["行", "名单姓名", "匹配姓名", "等级", "单位", "数据来源"], riskWidths, 40, riskY, {
      header: true
    });
    riskY += 26;
    riskRows.forEach((item, index) => {
      if (riskY > 748) {
        riskY = addReportPage(doc, fontPath);
        drawTableRow(doc, ["行", "名单姓名", "匹配姓名", "等级", "单位", "数据来源"], riskWidths, 40, riskY, {
          header: true
        });
        riskY += 26;
      }

      drawTableRow(
        doc,
        [
          item.rowIndex ? String(item.rowIndex) : String(index + 1),
          item.athleteNameInput,
          item.matchedAthleteName ?? "--",
          item.matchedLevel ?? "--",
          item.matchedOrganization ?? "--",
          item.matchedSourceName ?? "--"
        ],
        riskWidths,
        40,
        riskY,
        { fillColor: "#FEF2F2", textColor: "#7F1D1D" }
      );
      riskY += 26;
    });
    doc.y = riskY + 10;
  }

  doc.moveDown(1);
  drawSectionTitle(doc, "完整名单核验明细", "按原始名单顺序展示本次批次的逐行核验结果。");

  const startX = 40;
  const widths = [28, 32, 66, 66, 58, 78, 64, 123];
  let currentY = doc.y;

  drawTableRow(doc, ["#", "行", "名单姓名", "匹配姓名", "等级", "单位", "状态", "备注"], widths, startX, currentY, {
    header: true
  });
  currentY += 26;

  records.forEach((record, index) => {
    if (currentY > 748) {
      drawFooter(doc);
      doc.addPage();
      if (fontPath) {
        doc.font(fontPath);
      }
      currentY = 40;
      drawTableRow(
        doc,
        ["#", "行", "名单姓名", "匹配姓名", "等级", "单位", "状态", "备注"],
        widths,
        startX,
        currentY,
        {
          header: true
        }
      );
      currentY += 26;
    }

    drawTableRow(
      doc,
      [
        String(index + 1),
        record.rowIndex ? String(record.rowIndex) : "--",
        record.athleteNameInput,
        record.matchedAthleteName ?? "未查到",
        record.matchedLevel ?? "--",
        record.matchedOrganization ?? "--",
        formatStatusLabel(record.status),
        record.remark ?? "--"
      ],
      widths,
      startX,
      currentY,
      record.isRisk ? { fillColor: "#FEF2F2", textColor: "#7F1D1D" } : undefined
    );
    currentY += 26;
  });

  drawFooter(doc);

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
