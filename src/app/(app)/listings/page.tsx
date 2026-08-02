import { AccountMenu } from "@/components/layout/account-menu/AccountMenu";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { FlashToast } from "@/components/ui/toast/FlashToast";
import { CreateProfileCta } from "@/features/applicant/profile/components/CreateProfileCta";

export default function ListingsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppTopbar>
        <AccountMenu />
      </AppTopbar>
      <main className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-gutter pt-10">
        <h1 className="font-display text-heading-xl text-foreground">
          Mietobjekte
        </h1>
        <CreateProfileCta returnTo="/listings" />
      </main>
      <FlashToast />
    </div>
  );
}
