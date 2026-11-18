import { expect, it } from 'vitest';
import { boundedBody, boundedJson } from '../../src/lib/http-body';
import { trustedOrigin } from '../../src/lib/trusted-origin';
it.each([
  null,
  'null',
  'https://attacker.invalid',
  'https://trusted.invalid.attacker.invalid',
  'https://user@trusted.invalid',
  'https://trusted.invalid/path',
])('refuses missing, opaque or noncanonical origin %s', (origin) => {
  const headers = new Headers();
  if (origin !== null) headers.set('origin', origin);
  expect(
    trustedOrigin(
      new Request('https://trusted.invalid/api', { headers }),
      'https://trusted.invalid',
    ),
  ).toBe(false);
});
it('accepts only the exact configured origin, including its port', () => {
  expect(
    trustedOrigin(
      new Request('http://localhost:3000/api', { headers: { origin: 'http://localhost:3000' } }),
      'http://localhost:3000/path',
    ),
  ).toBe(true);
  expect(
    trustedOrigin(
      new Request('http://localhost:3000/api', { headers: { origin: 'http://localhost:4000' } }),
      'http://localhost:3000',
    ),
  ).toBe(false);
});
it('enforces the actual streamed size even when Content-Length lies or is absent', async () => {
  const body = 'x'.repeat(2048);
  for (const headers of [new Headers(), new Headers({ 'content-length': '1' })])
    expect(
      (
        await boundedBody(
          new Request('https://example.invalid', { method: 'POST', headers, body }),
          1024,
        )
      ).ok,
    ).toBe(false);
});
it('rejects malformed JSON rather than returning partially parsed input', async () => {
  expect(
    (
      await boundedJson(
        new Request('https://example.invalid', { method: 'POST', body: '{"role":' }),
      )
    ).ok,
  ).toBe(false);
});
