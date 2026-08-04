import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { AuthenticatedPublicRedirect } from "@/components/auth/AuthenticatedPublicRedirect";
import { ClearExpiredSessionGuard } from "@/components/auth/ClearExpiredSessionGuard";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { loginCopy } from "@/features/auth/copy/login";

interface LoginPageProps {
  searchParams: Promise<{ reset?: string; session?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <ClearExpiredSessionGuard expired={params.session === "expired"}>
      <AuthenticatedPublicRedirect>
        <PageShell className="flex-1">
          <AppTopbar className="mb-section" />

          <div className="flex h-[90dvh] flex-1 flex-col justify-center px-gutter sm:h-auto">
            <div className="mb-8 mx-auto w-full max-w-md">
              <h1 className="mb-2.5 font-display text-heading-xl font-medium text-foreground">
                {loginCopy.title}
              </h1>
              <p className="text-lead text-foreground-secondary">
                {loginCopy.subtitle}
              </p>
            </div>
            <LoginForm
              {...(params.reset === "success"
                ? { initialSuccessMessage: loginCopy.resetSuccess }
                : {})}
            />
          </div>
        </PageShell>
      </AuthenticatedPublicRedirect>
    </ClearExpiredSessionGuard>
  );
}
