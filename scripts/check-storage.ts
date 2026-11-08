import { EnvironmentSchema } from '../src/config/env';
import { providers } from '../src/composition/providers';
import { required } from '../src/adapters/db/transaction';
import type { PrivateProofStoragePort } from '../src/core/ports/bank.port';

async function verifyAccess(
  storage: PrivateProofStoragePort,
  storageKey: string,
  bytes: Uint8Array,
) {
  const { presignedUrl } = required(
    await storage.getTemporaryAdminViewUrl({ storageKey, expiresInSeconds: 60 }),
  );
  const privateRead = await fetch(presignedUrl, { signal: AbortSignal.timeout(10_000) });
  if (!privateRead.ok || !Buffer.from(await privateRead.arrayBuffer()).equals(Buffer.from(bytes)))
    throw Error('Signed read failed');
  const publicUrl = new URL(presignedUrl);
  publicUrl.search = '';
  const publicRead = await fetch(publicUrl, { signal: AbortSignal.timeout(10_000) });
  if (publicRead.ok) throw Error('Storage unexpectedly public');
  return presignedUrl;
}

async function main(): Promise<void> {
  const env = EnvironmentSchema.parse(process.env);
  if (env.APP_ENVIRONMENT !== 'staging' || env.PAYMENTS_ENABLED !== 'false')
    throw Error('Staging configuration required');
  const storage = providers(env).storage;
  const storageKey = `diagnostics/${crypto.randomUUID()}.png`;
  const bytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG1sAAAAASUVORK5CYII=',
    'base64',
  );
  required(await storage.uploadPrivateProof({ storageKey, bytes, contentType: 'image/png' }));
  let presignedUrl: string;
  try {
    presignedUrl = await verifyAccess(storage, storageKey, bytes);
  } finally {
    required(await storage.deleteProofImmediately(storageKey));
  }
  const deletedRead = await fetch(presignedUrl, {
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
  });
  if (deletedRead.status !== 404) throw Error('Deletion not verified');
  console.info('Stockage privé : écriture, lecture signée, refus public et suppression vérifiés.');
}

void main().catch(() => {
  console.error(
    'Contrôle du stockage échoué. Vérifier la configuration et le préfixe diagnostics/ pour un éventuel nettoyage. Aucun secret affiché.',
  );
  process.exitCode = 1;
});
