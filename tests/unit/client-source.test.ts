import { expect, it } from 'vitest';
import { clientSource } from '../../src/lib/client-source';
it('never trusts client-supplied forwarded addresses outside the known edge deployment', () => {
  expect(
    clientSource(
      new Headers({ 'x-forwarded-for': '198.51.100.1', 'x-vercel-forwarded-for': '192.0.2.1' }),
      false,
    ),
  ).toBe('local');
});
it('uses only the validated trusted edge address, never an arbitrary proxy chain', () => {
  expect(
    clientSource(
      new Headers({ 'x-forwarded-for': 'spoofed', 'x-vercel-forwarded-for': '192.0.2.1' }),
      true,
    ),
  ).toBe('192.0.2.1');
  for (const source of ['random', '192.0.2.1, 192.0.2.2']) {
    expect(clientSource(new Headers({ 'x-vercel-forwarded-for': source }), true)).toBe('local');
  }
});
it('canonicalizes IPv6 so alternate spellings share the same rate bucket', () => {
  const source = (value: string) =>
    clientSource(new Headers({ 'x-vercel-forwarded-for': value }), true);
  expect(source('2001:0db8:0000:0000:0000:0000:0000:0001')).toBe(source('2001:db8::1'));
});
