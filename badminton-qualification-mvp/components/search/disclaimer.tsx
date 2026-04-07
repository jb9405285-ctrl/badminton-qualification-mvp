import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function DisclaimerCard() {
  return (
    <Card className="border-slate-200/80 bg-[#f8fafc] shadow-soft">
      <CardHeader>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">Legal Notice</p>
        <CardTitle>免责声明</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm leading-6 text-slate-600">
        <p>1. 当前版本同时使用公开接口与本地数据源。</p>
        <p>2. 部分结果可能来自本地补充数据。</p>
        <p>3. 暂未接入商业授权数据源。</p>
        <p>4. 正式使用前请人工复核。</p>
      </CardContent>
    </Card>
  );
}
