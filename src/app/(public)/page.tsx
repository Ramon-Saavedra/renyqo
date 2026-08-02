import Link from "next/link";
import { AuthenticatedPublicRedirect } from "@/components/auth/AuthenticatedPublicRedirect";
import { buttonClass } from "@/components/ui/button/Button";

export default function Home() {
  return (
    <AuthenticatedPublicRedirect>
      <main>
        <div className="flex gap-space-3">
          <Link
            href="/register/account-type"
            className={buttonClass("primary")}
          >
            Registrieren
          </Link>
          <Link href="/login" className={buttonClass("ghost")}>
            Anmelden
          </Link>
        </div>
      </main>
    </AuthenticatedPublicRedirect>
  );
}
