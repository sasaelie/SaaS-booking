import { expect, it } from 'vitest';
import { contentSecurityPolicy } from '../../src/lib/content-security-policy';
it('allows only nonced scripts in production and refuses objects, injected handlers and untrusted framing', () => {
  const policy = contentSecurityPolicy(
    'example-random-nonce',
    '/plateforme',
    'https://example.invalid',
    false,
  );
  expect(policy).toContain("script-src 'self' 'nonce-example-random-nonce' 'strict-dynamic'");
  expect(policy).not.toContain('unsafe-eval');
  expect(policy).toContain("script-src-attr 'none'");
  expect(policy).toContain("frame-ancestors 'none'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("base-uri 'none'");
});
it('keeps approved external HTTPS embedding without enabling HTTP framing in a hosted deployment', () => {
  const policy = contentSecurityPolicy('nonce', '/embed/studio', 'https://example.invalid', false);
  expect(policy).toContain("frame-ancestors 'self' https:");
  expect(policy).not.toContain('http://localhost');
  expect(contentSecurityPolicy('nonce', '/embed/studio', 'http://127.0.0.1:3000', true)).toContain(
    'http://127.0.0.1:*',
  );
});
