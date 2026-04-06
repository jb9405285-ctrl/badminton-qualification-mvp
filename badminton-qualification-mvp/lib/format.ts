import { format } from "date-fns";

export function formatDate(value: Date | string | null | undefined, pattern = "yyyy-MM-dd") {
  if (!value) {
    return "--";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return format(date, pattern);
}

export function formatDateTime(value: Date | string | null | undefined) {
  return formatDate(value, "yyyy-MM-dd HH:mm");
}

export function formatStatusLabel(status: string) {
  const map: Record<string, string> = {
    PASSED: "通过",
    RISK: "疑似高等级选手",
    NOT_FOUND: "未查到记录",
    REVIEW: "需人工复核",
    PENDING: "待处理",
    NEEDS_MAPPING: "待选择姓名列",
    PROCESSED: "已完成",
    FAILED: "处理失败",
    DRAFT: "草稿",
    ACTIVE: "进行中",
    ARCHIVED: "已归档"
  };

  return map[status] ?? status;
}

export function formatCountLabel(value: number, suffix = "条") {
  return `${value}${suffix}`;
}
