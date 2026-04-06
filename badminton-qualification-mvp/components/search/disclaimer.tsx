import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DisclaimerCard() {
  return (
    <Card className="bg-white/92">
      <CardHeader>
        <CardTitle>免责声明</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
        <p>1. 当前数据仅用于演示。</p>
        <p>2. 暂未接入正式商业授权数据源。</p>
        <p>3. 当前查询结果可能来自实时公开接口或演示样例库，页面会明确标记来源。</p>
        <p>4. 实际使用前需核验数据合法性与准确性。</p>
      </CardContent>
    </Card>
  );
}
