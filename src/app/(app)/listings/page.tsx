import { AccountMenu } from "@/components/layout/account-menu/AccountMenu";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";

export default function ListingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppTopbar>
        <AccountMenu />
      </AppTopbar>
      <main className="mx-auto flex w-full max-w-6xl px-page pt-space-8">
        <h1 className="font-display text-heading-xl text-foreground">
          Mietobjekte
        </h1>
      </main>
    </div>
  );
}
