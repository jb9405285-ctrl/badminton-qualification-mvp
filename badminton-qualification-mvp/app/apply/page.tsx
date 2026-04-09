import { OrganizerApplicationForm } from "@/components/auth/organizer-application-form";
import { PublicShell } from "@/components/layout/public-shell";

export const dynamic = "force-dynamic";

export default function ApplyPage() {
  return (
    <PublicShell navMode="focus">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12 lg:flex-row lg:items-start lg:py-16">
        <section className="max-w-2xl space-y-5 lg:pt-8">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">正式站开通</p>
          <h1 className="font-serif text-4xl leading-tight text-slate-950 sm:text-5xl">
            先申请，再由平台管理员开通主办方账号
          </h1>
          <p className="text-base leading-8 text-slate-600 sm:text-lg">
            正式站不开放自助注册。你提交申请后，平台管理员审核通过，系统才会生成首次设密链接。
          </p>
        </section>

        <section className="w-full max-w-xl lg:ml-auto">
          <OrganizerApplicationForm />
        </section>
      </main>
    </PublicShell>
  );
}
