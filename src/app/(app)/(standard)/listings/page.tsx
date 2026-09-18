import { Suspense } from "react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { APP_TOPBAR_CLASS } from "@/components/layout/app-topbar/topbar-classes";
import { RenyqoSkeleton } from "@/components/ui/loading/RenyqoSkeleton";
import { ApplicantListingsView } from "@/features/applicant/listings/components/ApplicantListingsView";
import { AnimatedHeroTitle } from "@/features/applicant/listings/components/AnimatedHeroTitle";
import { ListingsSearchConsoleSkeleton } from "@/features/applicant/listings/components/ListingsSearchConsoleSkeleton";
import { ListingsLoadingGrid } from "@/features/applicant/listings/components/ListingsLoadingGrid";
import { ProfileNotice } from "@/features/applicant/listings/components/ProfileNotice";
import {
  LISTINGS_CONTENT_CLASS,
  LISTINGS_LEAD_CLASS,
  LISTINGS_RESULTS_CLASS,
  LISTINGS_TITLE_CLASS,
} from "@/features/applicant/listings/components/listings-layout-classes";
import { listingsCopy } from "@/features/applicant/listings/copy/listings";
import { ListingsTopbarActions } from "@/features/applicant/navigation/components/ListingsTopbarActions";

function ListingsPageFallback() {
  return (
    <div className={LISTINGS_CONTENT_CLASS}>
      <ProfileNotice returnTo="/listings" />
      <AnimatedHeroTitle className={LISTINGS_TITLE_CLASS} />
      <p className={LISTINGS_LEAD_CLASS}>{listingsCopy.hero.lead}</p>
      <ListingsSearchConsoleSkeleton />
      <div className={LISTINGS_RESULTS_CLASS}>
        <RenyqoSkeleton width={100} height={11} />
        <RenyqoSkeleton variant="pill" width={88} height={34} />
      </div>
      <ListingsLoadingGrid />
    </div>
  );
}

export default function ListingsPage() {
  return (
    <>
      <AppTopbar
        className={`${APP_TOPBAR_CLASS} w-full self-start bg-background`}
      >
        <ListingsTopbarActions />
      </AppTopbar>
      <Suspense fallback={<ListingsPageFallback />}>
        <ApplicantListingsView />
      </Suspense>
    </>
  );
}
