import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { AccountMenu } from "@/components/layout/account-menu/AccountMenu";

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopbar className="sticky top-0 z-30 w-full self-start bg-background">
        <AccountMenu />
      </AppTopbar>
      {children}
    </>
  );
}
