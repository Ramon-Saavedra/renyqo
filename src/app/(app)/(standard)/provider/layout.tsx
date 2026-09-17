import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { PROVIDER_TOPBAR_HEIGHT_CLASS } from "@/features/provider/topbar-classes";
import { ProviderAccountMenu } from "./ProviderAccountMenu";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopbar
        logoHref="/provider/dashboard"
        className={`sticky top-0 z-30 mb-section bg-background ${PROVIDER_TOPBAR_HEIGHT_CLASS}`}
      >
        <div id="provider-topbar-actions" className="contents" />
        <ProviderAccountMenu />
      </AppTopbar>
      {children}
    </>
  );
}
