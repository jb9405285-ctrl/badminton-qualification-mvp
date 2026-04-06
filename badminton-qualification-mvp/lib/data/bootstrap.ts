import { mapRiskCategory } from "@/lib/eligibility";
import { hashPassword } from "@/lib/auth/password";
import { demoAdmin, mockAthletes } from "@/lib/data/mock-athletes";
import { prisma } from "@/lib/prisma";
import { buildVerificationRecordInput, summarizeVerificationRecords } from "@/lib/services/verification";

let bootstrapPromise: Promise<void> | null = null;

async function seedDemoData() {
  const passwordHash = hashPassword(demoAdmin.password);

  const admin = await prisma.user.upsert({
    where: { email: demoAdmin.email },
    update: {
      name: demoAdmin.name
    },
    create: {
      name: demoAdmin.name,
      email: demoAdmin.email,
      passwordHash
    }
  });

  for (const athlete of mockAthletes) {
    await prisma.athlete.upsert({
      where: { externalKey: athlete.externalKey },
      update: {
        name: athlete.name,
        gender: athlete.gender,
        region: athlete.region,
        organization: athlete.organization,
        level: athlete.level,
        certificateNo: athlete.certificateNo,
        sport: athlete.sport ?? "羽毛球",
        certifiedAt: athlete.certifiedAt ? new Date(athlete.certifiedAt) : null,
        sourceName: athlete.sourceName,
        sourceUrl: athlete.sourceUrl,
        sourceType: athlete.sourceType ?? "mock",
        dataStatus: athlete.dataStatus ?? "演示数据",
        providerKey: athlete.providerKey ?? "mock",
        riskCategory: mapRiskCategory(athlete.level)
      },
      create: {
        externalKey: athlete.externalKey,
        name: athlete.name,
        gender: athlete.gender,
        region: athlete.region,
        organization: athlete.organization,
        level: athlete.level,
        certificateNo: athlete.certificateNo,
        sport: athlete.sport ?? "羽毛球",
        certifiedAt: athlete.certifiedAt ? new Date(athlete.certifiedAt) : null,
        sourceName: athlete.sourceName,
        sourceUrl: athlete.sourceUrl,
        sourceType: athlete.sourceType ?? "mock",
        dataStatus: athlete.dataStatus ?? "演示数据",
        providerKey: athlete.providerKey ?? "mock",
        riskCategory: mapRiskCategory(athlete.level)
      }
    });
  }

  const existingEvents = await prisma.event.count();

  if (existingEvents === 0) {
    const demoEvent = await prisma.event.create({
      data: {
        name: "2026 春季业余公开赛（演示）",
        organizerName: "星羽羽毛球俱乐部",
        eventDate: new Date("2026-05-18"),
        notes: "用于演示批量资格核验与报告导出。",
        status: "ACTIVE",
        createdById: admin.id
      }
    });

    const rawRows = [
      { 姓名: "李明轩", 组别: "男单公开组", 单位: "苏州实验中学" },
      { 姓名: "杜佳禾", 组别: "女单业余组", 单位: "无锡新锐俱乐部" },
      { 姓名: "张晨熙", 组别: "男单公开组", 单位: "广州青年队" },
      { 姓名: "孙怡宁", 组别: "女单公开组", 单位: "厦门海风俱乐部" },
      { 姓名: "罗可心", 组别: "女双业余组", 单位: "重庆羽友会" },
      { 姓名: "赵未录", 组别: "混双业余组", 单位: "个人报名" }
    ];

    const batch = await prisma.uploadBatch.create({
      data: {
        eventId: demoEvent.id,
        uploadedById: admin.id,
        originalFileName: "demo-roster.xlsx",
        fileType: "xlsx",
        status: "PROCESSED",
        detectedNameColumn: "姓名",
        totalRows: rawRows.length,
        columnsJson: JSON.stringify(["姓名", "组别", "单位"]),
        previewRowsJson: JSON.stringify(rawRows.slice(0, 5)),
        rawRowsJson: JSON.stringify(rawRows)
      }
    });

    const athletes = await prisma.athlete.findMany();
    const verificationInputs = rawRows.map((row, index) => {
      const matches = athletes.filter((item) => item.name === row.姓名);
      return buildVerificationRecordInput({
        athleteNameInput: row.姓名,
        eventId: demoEvent.id,
        batchId: batch.id,
        rowIndex: index + 2,
        rowDataJson: JSON.stringify(row),
        matches
      });
    });

    await prisma.verificationRecord.createMany({
      data: verificationInputs
    });

    const createdRecords = await prisma.verificationRecord.findMany({
      where: { batchId: batch.id }
    });

    const summary = summarizeVerificationRecords(createdRecords);

    await prisma.uploadBatch.update({
      where: { id: batch.id },
      data: {
        processedRows: summary.total,
        matchedRows: summary.matched,
        riskRows: summary.risk,
        unresolvedRows: summary.notFound + summary.review,
        summaryJson: JSON.stringify(summary)
      }
    });
  }
}

export async function ensureDemoData() {
  if (!bootstrapPromise) {
    bootstrapPromise = seedDemoData();
  }

  await bootstrapPromise;
}
