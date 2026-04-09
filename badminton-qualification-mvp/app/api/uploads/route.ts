import path from "path";

import { NextResponse } from "next/server";

import { buildEventWhereForUser } from "@/lib/auth/access";
import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { processBatchVerification } from "@/lib/services/batch-service";
import { persistUploadFile } from "@/lib/storage";
import { parseRosterFile } from "@/lib/uploads/parse-roster";

export const runtime = "nodejs";

const allowedExtensions = new Set([".xlsx", ".xls", ".csv"]);

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: "请先登录后再上传名单。"
      },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const eventId = String(formData.get("eventId") ?? "");
  const file = formData.get("file");

  if (!eventId) {
    return NextResponse.json(
      {
        ok: false,
        message: "请先选择赛事。"
      },
      { status: 400 }
    );
  }

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        ok: false,
        message: "请上传 .xlsx / .xls / .csv 文件。"
      },
      { status: 400 }
    );
  }

  const extension = path.extname(file.name).toLowerCase();

  if (!allowedExtensions.has(extension)) {
    return NextResponse.json(
      {
        ok: false,
        message: "文件格式不支持，请上传 .xlsx / .xls / .csv 文件。"
      },
      { status: 400 }
    );
  }

  try {
    const event = await prisma.event.findFirst({
      where: buildEventWhereForUser(user, { id: eventId }),
      select: {
        id: true
      }
    });

    if (!event) {
      return NextResponse.json(
        {
          ok: false,
          message: "赛事不存在，或当前账号无权上传到该赛事。"
        },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storedFilePath = await persistUploadFile(file.name, buffer);
    const parsed = parseRosterFile(file.name, buffer);

    const batch = await prisma.uploadBatch.create({
      data: {
        eventId,
        uploadedById: user.id,
        originalFileName: file.name,
        storedFilePath,
        fileType: parsed.fileType,
        status: parsed.detectedNameColumn ? "PENDING" : "NEEDS_MAPPING",
        detectedNameColumn: parsed.detectedNameColumn,
        totalRows: parsed.rows.length,
        columnsJson: JSON.stringify(parsed.columns),
        previewRowsJson: JSON.stringify(parsed.previewRows),
        rawRowsJson: JSON.stringify(parsed.rows)
      }
    });

    if (!parsed.detectedNameColumn) {
      return NextResponse.json({
        ok: true,
        needsMapping: true,
        batchId: batch.id,
        eventId,
        columns: parsed.columns,
        previewRows: parsed.previewRows
      });
    }

    const result = await processBatchVerification({
      batchId: batch.id,
      eventId,
      nameColumn: parsed.detectedNameColumn
    });

    return NextResponse.json({
      ok: true,
      eventId,
      batchId: batch.id,
      summary: result.summary
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "名单上传失败，请检查文件内容后重试。"
      },
      { status: 500 }
    );
  }
}
