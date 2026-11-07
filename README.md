# Studio Créatif 360 — Moteur de réservation

Sources de travail des jalons 0 à 6, organisées pour le dépôt SaaS-booking.
Architecture visée : Next.js App Router, TypeScript strict, domaine métier, ports et adaptateurs PostgreSQL/Drizzle et Stripe.

## Contenu et statut

Les blocs de code ont été rangés sous leurs chemins de destination et leur présentation a été harmonisée. La logique et les valeurs fournies ont été conservées, y compris les parties provisoires et les défauts connus. Cette première version organise le projet ; elle ne constitue pas une correction fonctionnelle ni une validation de production.

- `src/config/` : constantes métier.
- `src/lib/` : Result, journalisation et communication structurée belge.
- `src/core/domain/` : séances, disponibilité, horaires, CGV, validation, codes de report, fichiers et jetons.
- `src/core/ports/` : contrats de persistance, paiement, notifications et stockage.
- `src/core/use-cases/` : orchestration réservation, webhook, reports, virement, fermeture et rétention.
- `src/adapters/` : schéma PostgreSQL, réservation transactionnelle et adaptateur Stripe.
- `src/app/` : widget React, CSS, exemple de Server Action et route webhook.
- `docs/` : architecture, inventaire, limites connues et éléments initiaux de design.
- `AGENTS.md` : règles d’ingénierie transmises.

La dernière version de `session-repository.port.ts` remplace le premier contrat `ensureAndLockSessionForBooking`. La version complète de `ice-tokens.css` sert de feuille de style principale. Les premières références de design et le premier contrat sont conservés comme documents dans `docs/references/`, hors compilation.

Le projet est organisé à la racine du dépôt SaaS-booking. Les secrets, dépendances locales et fichiers générés sont exclus par `.gitignore`. Aucun déploiement n’est inclus.

## Installation locale ultérieure

Les versions de dépendances et les scripts du `package.json` reçu ont été conservés. Avant installation, lire `docs/POINTS-A-COMPLETER.md` : la configuration reçue comporte des incompatibilités.

Après correction de ces points :

```bash
npm install
cp .env.example .env.local
npm run verify
npm run dev
```

Renseigner les secrets localement. `.env.example` contient uniquement les exemples reçus. Ne pas utiliser ces valeurs comme secrets réels.

## À savoir avant de lancer l’application

Les adaptateurs de production d’activité, paiement en base, notifications, stockage, reports, virement, fermeture et RGPD n’ont pas été fournis. Les injections `{} as any` restent présentes dans les exemples et ne peuvent pas fonctionner à l’exécution.

Les fichiers App Router `layout.tsx` et `page.tsx`, le branchement CSS/Tailwind, la connexion PostgreSQL, les migrations et la composition des dépendances sont à réaliser. Aucun écran fonctionnel complet n’est ajouté artificiellement.

Les tests reçus reposent sur des doubles en mémoire ; ils ne constituent pas un test d’intégration PostgreSQL ou Stripe. Les affirmations de conformité juridique et de durée de conservation présentes dans les sources n’ont pas été vérifiées dans cette mise en archive.

Voir `docs/VERIFICATION.md` pour les contrôles réellement exécutés et `docs/INVENTAIRE.md` pour tous les fichiers.
