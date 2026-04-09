import { redirect } from "next/navigation";

import { OrganizerApplicationReview } from "@/components/dashboard/organizer-application-review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSuperAdmin } from "@/lib/auth/access";
import { requireUser } from "@/lib/auth/session";
import { listOrganizerApplications } from "@/lib/services/organizer-application-service";
import type { OrganizerApplicationListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardApplicationsPage() {
  const user = await requireUser();

  if (!isSuperAdmin(user)) {
    redirect("/dashboard");
  }

  const applications = await listOrganizerApplications();
  const items: OrganizerApplicationListItem[] = applications.map((item) => ({
    id: item.id,
    organizationName: item.organizationName,
    contactName: item.contactName,
    contactEmail: item.contactEmail,
    contactPhone: item.contactPhone,
    note: item.note,
    status: item.status as OrganizerApplicationListItem["status"],
    reviewedAt: item.reviewedAt ? item.reviewedAt.toISOString() : null,
    reviewNote: item.reviewNote,
    createdAt: item.createdAt.toISOString(),
    setupPath: item.approvedUser?.passwordSetupTokens[0]
      ? `/setup-account?token=${item.approvedUser.passwordSetupTokens[0].token}`
      : null,
    setupTokenExpiresAt: item.approvedUser?.passwordSetupTokens[0]?.expiresAt
      ? item.approvedUser.passwordSetupTokens[0].expiresAt.toISOString()
      : null,
    accountReady: Boolean(item.approvedUser?.passwordHash),
    accountStatus: (item.approvedUser?.status as OrganizerApplicationListItem["accountStatus"]) ?? null
  }));

  return (
    <div className="grid gap-6">
      <Card className="dashboard-panel border-white/80">
        <CardHeader>
          <CardTitle>主办方申请审批</CardTitle>
        </CardHeader>
        <CardContent>
          <OrganizerApplicationReview initialItems={items} />
        </CardContent>
      </Card>
    </div>
  );
}
