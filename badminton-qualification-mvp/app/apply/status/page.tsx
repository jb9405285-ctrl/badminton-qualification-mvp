import { ApplicationStatusForm } from "@/components/auth/application-status-form";
import { PublicShell } from "@/components/layout/public-shell";

export const dynamic = "force-dynamic";

export default function ApplyStatusPage({
  searchParams
}: {
  searchParams: { applicationId?: string; contactEmail?: string };
}) {
  return (
    <PublicShell navMode="focus">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:py-16">
        <section className="max-w-2xl space-y-5">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">申请进度</p>
          <h1 className="font-serif text-4xl leading-tight text-slate-950 sm:text-5xl">
            查看主办方申请的当前状态
          </h1>
          <p className="text-base leading-8 text-slate-600 sm:text-lg">
            如果你的申请已经获批，查询结果会直接显示首次设密入口；设密完成后即可返回登录页进入工作台。
          </p>
        </section>

        <section className="w-full max-w-xl">
          <ApplicationStatusForm
            initialApplicationId={searchParams.applicationId?.trim() ?? ""}
            initialContactEmail={searchParams.contactEmail?.trim() ?? ""}
          />
        </section>
      </main>
    </PublicShell>
  );
}
