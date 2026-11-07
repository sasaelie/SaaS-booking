import type { ReactNode } from 'react';
import './_ui/ice-tokens.css';
import './_ui/widget-layout.css';
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
