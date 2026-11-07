# AGENTS.md — RÈGLES D'INGÉNIERIE NON NÉGOCIABLES

## 1. IDENTITÉ ET ARCHITECTURE DU PROJET
Tu développes un **Moteur de Réservation Générique SaaS-Ready** en **Architecture Hexagonale stricte (Ports & Adapters)**.
- **Stack :** Next.js (App Router), TypeScript (`strict: true`, `noUncheckedIndexedAccess: true`), PostgreSQL (UE), Drizzle ORM, Zod, Stripe, Resend, Vitest.
- **Design System :** Crystal Ice Block & Liquid Meniscus (`src/app/_ui/ice-tokens.css`). Zéro couleur hexadécimale en dur dans les composants (utiliser les variables CSS).

## 2. GLOSSAIRE UNIQUE (INTERDICTION D'INVENTER DES SYNONYMES)
Utilise exclusivement ces identifiants anglais dans le code, les tables et les fichiers :
- Organisateur -> `Organization` (`organization_id` obligatoire partout dès la V1)
- Activité -> `Activity` (1 Activité = 1 Prix unique en centimes `price_cents`)
- Modèle hebdomadaire -> `WeeklyTemplate`
- Créneau -> `TimeSlot`
- Séance -> `Session` (créée à la volée à la 1re réservation via Upsert + `SELECT ... FOR UPDATE`)
- Séance à date précise -> `ManualSession` (`is_manual = true`)
- Période de pause -> `PausePeriod`
- Fenêtre de réservation -> `BookingWindow`
- Réservation -> `Booking` (Strictement 1 place par réservation)
- Code de report -> `RescheduleVoucher` (Jeton d'état serveur à usage unique)

## 3. ISOLATION STRICTE DES COUCHES (ZÉRO RACCOURCI)
- `src/config/` : Constantes nommées (`constants.ts`) et validation Zod de l'environnement (`env.ts`).
- `src/lib/` : Utilitaires purs (`result.ts`, `logger.ts`, `modulo97.ts`).
- `src/core/domain/` : Logique métier pure. **INTERDICTION ABSOLUE** d'importer Next.js, React, Drizzle, Stripe ou Resend.
- `src/core/ports/` : Interfaces TypeScript des contrats (`PaymentGatewayPort`, `NotificationPort`, `FileStoragePort`, Repositories).
- `src/core/use-cases/` : Orchestration métier retournant systématiquement `Promise<Result<T, AppError>>`.
- `src/adapters/` : Implémentations concrètes (Drizzle SQL, Stripe, BankTransfer, Resend, R2 Storage).
- `src/app/` : Interface Next.js. **INTERDICTION** d'importer `src/adapters/db` ou `stripe`. L'UI appelle uniquement `src/core/use-cases/`.

## 4. LIMITES DE CODE ET GESTION DES ERREURS
1. **Taille maximale :** **200 lignes max par fichier**, **40 lignes max par fonction**. Une seule responsabilité par fichier.
2. **Zéro `any`, zéro `@ts-ignore`, zéro valeur magique :** toute constante numérique ou texte métier vient de `src/config/constants.ts`.
3. **Zéro exception sauvage dans le cœur métier :** utilise exclusivement `Result<T, AppError>` (`ok()` / `err()`).
4. **Logs normalisés obligatoires :** toute erreur ou anomalie doit être journalisée via `src/lib/logger.ts` qui force le format exact :
   `[Module :: fonction] cause | reçu | attendu`

## 5. PROTOCOLE D'EXÉCUTION PAR JALON
Pour chaque fonctionnalité, respecte cet ordre strict :
1. Schéma Zod (`validation`) -> 2. Contrat (`port`) -> 3. Test unitaire (`Vitest`) -> 4. Cœur métier (`use-case`) -> 5. Adaptateur -> 6. UI.
Avant de considérer une tâche terminée, exécute `npm run verify` (`tsc --noEmit && eslint . && vitest run`). Si un seul contrôle échoue, corrige-le immédiatement avant de poursuivre.
