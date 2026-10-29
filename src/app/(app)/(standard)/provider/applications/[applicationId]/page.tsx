import { ProviderApplicationWorkspace } from "@/features/provider/dashboard/applicant-workflow/components/ProviderApplicationWorkspace";

export default async function ProviderApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return <ProviderApplicationWorkspace applicationId={applicationId} />;
}
