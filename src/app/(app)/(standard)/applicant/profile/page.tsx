import { Suspense } from "react";
import { ApplicantProfileForm } from "@/features/applicant/profile/components/ApplicantProfileForm";

export default function ApplicantProfilePage() {
  return (
    <Suspense>
      <ApplicantProfileForm />
    </Suspense>
  );
}
