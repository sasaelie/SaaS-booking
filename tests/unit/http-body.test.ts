import { expect, it } from 'vitest';
import { boundedBody, boundedJson } from '../../src/lib/http-body';
it('limits bodies even without a Content-Length header', async () => {
  const request = new Request('http://local', { method: 'POST', body: 'too large' });
  expect((await boundedBody(request, 3)).ok).toBe(false);
});
it('returns a typed failure for malformed JSON', async () => {
  expect(
    (await boundedJson(new Request('http://local', { method: 'POST', body: '{invalid' }))).ok,
  ).toBe(false);
});
