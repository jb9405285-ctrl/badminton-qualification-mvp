import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_ACCOUNT_EMAIL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function SettingsPage() {
  const athleteCount = await prisma.athlete.count();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="dashboard-panel border-white/80">
        <CardHeader className="pb-4">
          <CardTitle>当前规则说明</CardTitle>
          <CardDescription>当前版本使用固定风险规则。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <div className="dashboard-inset p-4">
            <p>1. 二级运动员及以上统一视为风险。</p>
          </div>
          <div className="dashboard-inset p-4">
            <p>2. 风险范围包括：二级运动员、一级运动员、运动健将、国际级运动健将。</p>
          </div>
          <div className="dashboard-inset p-4">
            <p>3. 未查到记录不等于绝对安全，建议仍保留人工复核流程。</p>
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-panel border-white/80">
        <CardHeader className="pb-4">
          <CardTitle>数据与账号</CardTitle>
          <CardDescription>当前环境的账号与数据策略。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
          <div className="dashboard-inset p-4">
            <p>后台账号：{DEMO_ACCOUNT_EMAIL}</p>
          </div>
          <div className="dashboard-inset p-4">
            <p>本地记录库：{athleteCount} 条羽毛球数据</p>
          </div>
          <div className="dashboard-inset p-4">
            <p>数据源策略：公开接口优先，异常时切换本地数据源。</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
