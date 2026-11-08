import { expect, it } from 'vitest';
import sharp from 'sharp';
import { ProofImageAdapter } from '../../src/adapters/storage/proof-image.adapter';
import { OidcAuthorizationAdapter } from '../../src/adapters/auth/oidc-authorization.adapter';
import { validateBankProofBinary } from '../../src/core/domain/proof-validator';
import { ERROR_CODES } from '../../src/config/constants';
it('rejects a PDF header and a truncated image after decoding', async () => {
  expect(validateBankProofBinary(new Uint8Array([37, 80, 68, 70])).ok).toBe(false);
  expect((await new ProofImageAdapter().sanitize(new Uint8Array([255, 216, 255]))).ok).toBe(false);
});
it('decodes a real image and re-encodes it without retaining arbitrary bytes', async () => {
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'white' } })
    .png()
    .toBuffer();
  const result = await new ProofImageAdapter().sanitize(png);
  expect(result.ok).toBe(true);
  if (result.ok) expect((await sharp(result.value).metadata()).format).toBe('png');
});
it('fails closed when administrator authentication is not configured', async () => {
  const result = await new OidcAuthorizationAdapter('untrusted', null).authorizeOrganizationAdmin(
    'org',
  );
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
});
