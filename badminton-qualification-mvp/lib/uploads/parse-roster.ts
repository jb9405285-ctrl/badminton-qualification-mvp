import path from "path";

import * as XLSX from "xlsx";

import { NAME_COLUMN_CANDIDATES } from "@/lib/constants";
import type { ParsedRosterRow, UploadParseResult } from "@/lib/types";

function sanitizeHeader(value: unknown, index: number) {
  const header = String(value ?? "").trim();
  return header.length > 0 ? header : `列${index + 1}`;
}

export function detectNameColumn(columns: string[]) {
  const lowered = columns.map((column) => column.trim().toLowerCase());

  for (const candidate of NAME_COLUMN_CANDIDATES) {
    const index = lowered.findIndex((column) => column === candidate.toLowerCase());

    if (index >= 0) {
      return columns[index];
    }
  }

  return null;
}

export function parseRosterFile(fileName: string, buffer: Buffer): UploadParseResult {
  const extension = path.extname(fileName).toLowerCase();
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error("上传文件中没有可读取的工作表。");
  }

  const sheet = workbook.Sheets[firstSheetName];
  const sheetRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false
  });

  if (sheetRows.length === 0) {
    throw new Error("上传文件为空，请重新选择名单文件。");
  }

  const columns = sheetRows[0].map((value, index) => sanitizeHeader(value, index));
  const rows: ParsedRosterRow[] = sheetRows
    .slice(1)
    .map((row) => {
      return columns.reduce<ParsedRosterRow>((accumulator, column, columnIndex) => {
        accumulator[column] = String(row[columnIndex] ?? "").trim();
        return accumulator;
      }, {});
    })
    .filter((row) => Object.values(row).some((value) => value.length > 0));

  return {
    columns,
    rows,
    previewRows: rows.slice(0, 5),
    detectedNameColumn: detectNameColumn(columns),
    fileType: extension.replace(".", "") || "xlsx"
  };
}
