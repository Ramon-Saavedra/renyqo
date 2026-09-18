import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { APP_TOPBAR_CLASS } from "@/components/layout/app-topbar/topbar-classes";
import { AccountMenu } from "@/components/layout/account-menu/AccountMenu";

export default function ApplicantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopbar
        className={`${APP_TOPBAR_CLASS} w-full self-start bg-background`}
      >
        <AccountMenu />
      </AppTopbar>
      {children}
    </>
  );
}
