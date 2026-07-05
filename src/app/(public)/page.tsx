import Link from "next/link";
import { buttonClass } from "@/components/ui/button/Button";

export default function Home() {
  return (
    <main>
      <div className="flex gap-space-3">
        <Link href="/register/account-type" className={buttonClass("primary")}>
          Registrieren
        </Link>
        <Link href="/login" className={buttonClass("ghost")}>
          Anmelden
        </Link>
      </div>
    </main>
  );
}
