import { SetupAccountForm } from "@/components/auth/setup-account-form";
import { PublicShell } from "@/components/layout/public-shell";
import { getPasswordSetupToken } from "@/lib/auth/setup-token";

export const dynamic = "force-dynamic";

export default async function SetupAccountPage({
  searchParams
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token?.trim() ?? "";
  const setupToken = token ? await getPasswordSetupToken(token) : null;

  return (
    <PublicShell navMode="focus">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 lg:py-16">
        {setupToken ? (
          <div className="mx-auto w-full max-w-xl">
            <SetupAccountForm
              initialName={setupToken.user.name}
              organizationName={setupToken.user.organization?.name ?? "主办方"}
              token={token}
            />
          </div>
        ) : (
          <div className="mx-auto w-full max-w-2xl rounded-[32px] border border-rose-200 bg-white/92 px-8 py-10 text-center shadow-panel">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">设密链接无效或已过期</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              请联系平台管理员重新生成首次设密链接后再继续。
            </p>
          </div>
        )}
      </main>
    </PublicShell>
  );
}
