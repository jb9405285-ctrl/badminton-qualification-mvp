import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_ACCOUNT_EMAIL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const athleteCount = await prisma.athlete.count();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>当前规则说明</CardTitle>
          <CardDescription>为了保证演示一致性，MVP 阶段使用固定风险规则。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>1. 二级运动员及以上统一视为风险。</p>
          <p>2. 风险范围包括：二级运动员、一级运动员、运动健将、国际级运动健将。</p>
          <p>3. 未查到记录不等于绝对安全，建议仍保留人工复核流程。</p>
        </CardContent>
      </Card>

      <Card className="bg-white/90">
        <CardHeader>
          <CardTitle>演示数据与账号</CardTitle>
          <CardDescription>本地演示环境的固定数据说明。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <p>后台账号：{DEMO_ACCOUNT_EMAIL}</p>
          <p>演示运动员库：{athleteCount} 条 mock 羽毛球数据</p>
          <p>数据源策略：当前走 mock provider，后续可替换为真实官网/API provider。</p>
        </CardContent>
      </Card>
    </div>
  );
}
