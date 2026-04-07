import type { ReactNode } from "react";

import type { Metadata } from "next";

import "@/app/globals.css";

import { APP_NAME } from "@/lib/constants";
import { ensureDemoData } from "@/lib/data/bootstrap";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "羽毛球赛事资格核验工具，支持公众查询、批量筛查、风险标记与结果导出。"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  await ensureDemoData();

  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
