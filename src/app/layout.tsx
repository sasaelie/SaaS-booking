import './_portal/commercial.css';
import './_ui/appearance.css';
import type { ReactNode } from 'react';
import { SessionHistorySync } from './_auth/SessionHistorySync';
import { SessionExitGuard } from './_auth/SessionExitGuard';
import { StagingNotice } from './_ui/StagingNotice';
import './_ui/staging.css';
import './_ui/participant.css';
import './_ui/ice-tokens.css';
import './_ui/brand.css';
import './_ui/widget-layout.css';
import './_ui/booking-shell.css';
import './_ui/booking-story.css';
import './_ui/booking-steps.css';
import './_ui/booking-calendar.css';
import './_ui/booking-slots.css';
import './_ui/booking-fields.css';
import './_ui/booking-voucher.css';
import './_ui/booking-checkout.css';
import './_ui/booking-result.css';
import './_ui/booking-responsive.css';
import './_ui/booking-picker-responsive.css';
import './_portal/portal-layout.css';
import './_portal/portal-components.css';
import './_portal/portal-details.css';
import './_portal/portal-forms.css';
import './_portal/portal-media.css';
import './_portal/portal-responsive.css';
import './_portal/navigation.css';
import './_portal/administration.css';
import './_auth/auth.css';
import './_ui/service.css';
import './_ui/story-photo.css';
import './_ui/status-lights.css';
import './_ui/catalog-cards.css';
import './_portal/session-details.css';
import './_portal/portal-alignment.css';
import './_ui/buttons.css';
import './_ui/glass-frames.css';
import './_ui/text-links.css';
import './_portal/feature-comparison.css';
import './_ui/modal.css';
import './_ui/social-glass.css';
export const metadata = {
  title: 'Studio Créatif 360 — Réservations',
  description: 'Réservez votre place à une activité.',
};
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SessionExitGuard />
        <SessionHistorySync />
        <StagingNotice />
        {children}
      </body>
    </html>
  );
}
