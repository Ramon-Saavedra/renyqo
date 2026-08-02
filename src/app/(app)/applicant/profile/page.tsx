import { Suspense } from "react";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { ApplicantProfileForm } from "@/features/applicant/profile/components/ApplicantProfileForm";

export default function ApplicantProfilePage() {
  return (
    <PageShell>
      <Suspense>
        <ApplicantProfileForm />
      </Suspense>
    </PageShell>
  );
}
