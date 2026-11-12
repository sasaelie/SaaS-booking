import { headers } from 'next/headers';
import { MARKETING } from '../config/marketing';
import { currentVisitor } from '../composition/current-visitor';
import { MarketingHeader } from './_marketing/MarketingHeader';
import { MarketingHero } from './_marketing/MarketingHero';
import { MarketingWorkflow, MarketingBenefits } from './_marketing/MarketingFeatures';
import { MarketingPricing } from './_marketing/MarketingPricing';
import { MarketingFaq, MarketingFinalAction } from './_marketing/MarketingFaq';
import { MarketingFooter } from './_marketing/MarketingFooter';
import { publicMetadata } from './_marketing/public-metadata';
import { PublicStructuredData } from './_marketing/PublicStructuredData';
import './_marketing/marketing.css';
export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return publicMetadata(MARKETING.TITLE, MARKETING.DESCRIPTION);
}
export default async function Home() {
  const actor = await currentVisitor(new Headers(await headers()));
  return (
    <div className="marketing-root">
      <MarketingHeader connected={actor !== null} />
      <main className="marketing-main" id="contenu" tabIndex={-1}>
        <MarketingHero name={actor?.name ?? null} />
        <MarketingWorkflow />
        <MarketingBenefits />
        <MarketingPricing />
        <MarketingFaq />
        <MarketingFinalAction connected={actor !== null} />
      </main>
      <MarketingFooter />
      <PublicStructuredData />
    </div>
  );
}
