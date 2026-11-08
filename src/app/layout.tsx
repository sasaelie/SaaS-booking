import type { ReactNode } from 'react';
import './_ui/ice-tokens.css';
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
export const metadata = {
  title: 'Studio Créatif 360 — Réservations',
  description: 'Réservez votre place à une activité.',
};
export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
