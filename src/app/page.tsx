import { headers } from 'next/headers';
import { MARKETING } from '../config/marketing';
import { currentVisitor } from '../composition/current-visitor';
import { MarketingHeader } from './_marketing/MarketingHeader';
import { MarketingHero } from './_marketing/MarketingHero';
import { MarketingWorkflow } from './_marketing/MarketingFeatures';
import { MarketingPricing } from './_marketing/MarketingPricing';
import { MarketingFooter } from './_marketing/MarketingFooter';
import { MarketingDemo } from './_marketing/MarketingDemo';
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
      <MarketingDemo>
        <main className="marketing-main" id="contenu" tabIndex={-1}>
          <MarketingHero name={actor?.name ?? null} />
          <MarketingWorkflow />
          <MarketingPricing />
        </main>
      </MarketingDemo>
      <MarketingFooter />
      <PublicStructuredData />
    </div>
  );
}
