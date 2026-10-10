import { ApplicationWorkspace } from "@/features/applicant/applications/components/workspace/ApplicationWorkspace";

export default async function ApplicantApplicationPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = await params;
  return <ApplicationWorkspace applicationId={applicationId} />;
}
