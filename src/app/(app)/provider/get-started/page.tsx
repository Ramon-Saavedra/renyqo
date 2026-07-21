import { HelpCircle } from "lucide-react";
import { AppTopbar } from "@/components/layout/app-topbar/AppTopbar";
import { PageShell } from "@/components/layout/page-shell/PageShell";
import { buttonClass } from "@/components/ui/button/Button";
import { AppIcon } from "@/components/ui/icon/AppIcon";
import { BenefitsSection } from "@/features/provider/empty-state/components/BenefitsSection";
import { EmptyStateHero } from "@/features/provider/empty-state/components/EmptyStateHero";
import { FlowStepsCard } from "@/features/provider/empty-state/components/FlowStepsCard";
import { WelcomeGreeting } from "@/features/provider/empty-state/components/WelcomeGreeting";
import { providerEmptyStateCopy } from "@/features/provider/empty-state/copy/empty-state";
import { AccountMenu } from "@/features/provider/user-menu/components/AccountMenu";

export default function ProviderGetStartedPage() {
  const copy = providerEmptyStateCopy;

  return (
    <PageShell>
      <AppTopbar className="mb-section">
        <button type="button" className={buttonClass("ghost")}>
          <AppIcon icon={HelpCircle} size={14} strokeWidth={1.6} decorative />
          {copy.topbar.help}
        </button>
        <AccountMenu />
      </AppTopbar>

      <div className="px-gutter">
        <section className="mb-section grid grid-cols-1 items-center gap-20 lg:grid-cols-2">
          <EmptyStateHero
            welcome={<WelcomeGreeting />}
            title={copy.hero.title}
            lead={copy.hero.lead}
            ctaLabel={copy.hero.cta.label}
            ctaHref={copy.hero.cta.href}
            trust={copy.hero.trust}
          />

          <FlowStepsCard
            kicker={copy.flow.kicker}
            steps={copy.flow.steps}
            currentIndex={0}
          />
        </section>

        <BenefitsSection
          title={copy.benefits.title}
          description={copy.benefits.description}
          items={copy.benefits.items}
        />
      </div>
    </PageShell>
  );
}
