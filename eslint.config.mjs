// eslint.config.mjs
import nextPlugin from '@next/eslint-plugin-next';

export default [
  {
    files: ['src/app/**/*.{ts,tsx}'],
    plugins: { '@next/next': nextPlugin },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/adapters/db/**', '**/db/**', 'drizzle-orm*'],
              message:
                'Architecture Hexagonale interdite : src/app/ ne doit pas importer directement la base de données. Utilisez un Use-Case ou une Server Action.',
            },
            {
              group: ['**/adapters/payments/**', 'stripe*'],
              message:
                'Architecture Hexagonale interdite : src/app/ ne doit pas importer directement le SDK Stripe. Passez par les ports et adaptateurs.',
            },
          ],
        },
      ],
    },
  },
];
