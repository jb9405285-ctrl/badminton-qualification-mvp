import type { ReactNode } from "react";

import type { Metadata } from "next";

import "./globals.css";

import { ToastProvider } from "@/components/ui/toast";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "羽毛球赛事资格核验工具，支持公众查询、批量筛查、风险标记与结果导出。"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
