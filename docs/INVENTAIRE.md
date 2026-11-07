# Inventaire des fichiers

Chemins relatifs à la racine du dépôt SaaS-booking.

54 fichiers, dont 39 sources et huit suites Vitest.

```text
.env.example
.gitignore
AGENTS.md
MANIFEST.sha256
README.md
docs/ARCHITECTURE.md
docs/INVENTAIRE.md
docs/POINTS-A-COMPLETER.md
docs/VERIFICATION.md
docs/references/design-system.json
docs/references/ice-initial.css.txt
docs/references/session-repository-initial.ts.txt
eslint.config.mjs
package.json
src/adapters/db/drizzle-session.repository.ts
src/adapters/db/schema.ts
src/adapters/payments/stripe-payment.adapter.ts
src/app/_ui/IceBookingWidget.tsx
src/app/_ui/ice-tokens.css
src/app/actions/booking.actions.ts
src/app/api/webhooks/stripe/route.ts
src/config/constants.ts
src/core/domain/__tests__/milestone1-concurrency.test.ts
src/core/domain/__tests__/milestone1.test.ts
src/core/domain/booking-validation.ts
src/core/domain/proof-validator.ts
src/core/domain/seat-calculator.ts
src/core/domain/self-service-token.ts
src/core/domain/session-truth.ts
src/core/domain/session-types.ts
src/core/domain/terms-generator.ts
src/core/domain/timezone.ts
src/core/domain/voucher-engine.ts
src/core/ports/bank-and-closure.port.ts
src/core/ports/booking-ports.ts
src/core/ports/payment-gateway.port.ts
src/core/ports/session-repository.port.ts
src/core/ports/voucher.port.ts
src/core/use-cases/__tests__/milestone2.test.ts
src/core/use-cases/__tests__/milestone3.test.ts
src/core/use-cases/__tests__/milestone4.test.ts
src/core/use-cases/__tests__/milestone5.test.ts
src/core/use-cases/__tests__/milestone6.test.ts
src/core/use-cases/bank-transfer-workflow.use-case.ts
src/core/use-cases/close-session-with-protection.use-case.ts
src/core/use-cases/create-booking.use-case.ts
src/core/use-cases/gdpr-retention.use-case.ts
src/core/use-cases/handle-stripe-webhook.use-case.ts
src/core/use-cases/voucher-lifecycle.use-case.ts
src/lib/__tests__/milestone0.test.ts
src/lib/logger.ts
src/lib/modulo97.ts
src/lib/result.ts
tsconfig.json
```
