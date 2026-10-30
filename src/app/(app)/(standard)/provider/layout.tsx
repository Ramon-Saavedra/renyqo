import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { TopbarAccountSection } from "@/components/layout/app-topbar/TopbarAccountSection";
import { APP_TOPBAR_CLASS } from "@/components/layout/app-topbar/topbar-classes";

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppTopbar
        logoHref="/provider/dashboard"
        className={`${APP_TOPBAR_CLASS} mb-section bg-background`}
      >
        <div id="provider-topbar-actions" className="contents" />
        <TopbarAccountSection role="provider" />
      </AppTopbar>
      {children}
    </>
  );
}
