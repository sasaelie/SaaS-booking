import { expect, it, vi } from 'vitest';
import { WebsitePreviewAccessUseCase } from '../../src/core/use-cases/portal/website-preview.use-case';
import { WEBSITE_PREVIEW as W } from '../../src/config/website-preview';
import { ok } from '../../src/lib/result';
import { failure } from '../../src/lib/errors';
import { ERROR_CODES } from '../../src/config/constants';
import type { WebsitePreviewAccessPorts } from '../../src/core/ports/website-preview';
function fixture() {
  const ports = {
    security: {
      read: vi.fn<WebsitePreviewAccessPorts['security']['read']>(async () =>
        ok({ enabled: false, verified: false }),
      ),
    },
    catalog: {
      execute: vi.fn<WebsitePreviewAccessPorts['catalog']['execute']>(async () =>
        ok({
          organizationId: 'organization',
          name: 'Studio',
          slug: W.SLUG,
          theme: 'SAGE',
          hasLogo: false,
          showPlatformSignature: false,
          activities: [],
        }),
      ),
    },
    organizations: {
      get: vi.fn<WebsitePreviewAccessPorts['organizations']['get']>(async () =>
        ok({ id: 'organization', role: 'OWNER' }),
      ),
    },
  };
  return { ports, useCase: new WebsitePreviewAccessUseCase(ports, true) };
}
it('refuses production and an unknown website before reading private information', async () => {
  const f = fixture();
  expect((await new WebsitePreviewAccessUseCase(f.ports, false).execute(W.SLUG)).ok).toBe(false);
  expect((await f.useCase.execute('another-organization')).ok).toBe(false);
  expect(f.ports.security.read).not.toHaveBeenCalled();
});
it('requires an administrator session before looking up or synchronizing an organization', async () => {
  const f = fixture();
  f.ports.security.read.mockResolvedValue(failure(ERROR_CODES.UNAUTHORIZED, 'Test', 'security'));
  expect((await f.useCase.execute(W.SLUG)).ok).toBe(false);
  expect(f.ports.catalog.execute).not.toHaveBeenCalled();
  expect(f.ports.organizations.get).not.toHaveBeenCalled();
});
it('requires the second factor again when the administrator has enabled protection', async () => {
  const f = fixture();
  f.ports.security.read.mockResolvedValue(ok({ enabled: true, verified: false }));
  const result = await f.useCase.execute(W.SLUG);
  expect(result.ok ? null : result.error.code).toBe('MFA_REQUIRED');
  expect(f.ports.catalog.execute).not.toHaveBeenCalled();
});
it('requires organization ownership in addition to administrator status', async () => {
  const f = fixture();
  f.ports.organizations.get.mockResolvedValue(failure(ERROR_CODES.UNAUTHORIZED, 'Test', 'owner'));
  expect((await f.useCase.execute(W.SLUG)).ok).toBe(false);
  expect(f.ports.organizations.get).toHaveBeenCalledWith('organization');
});
it('authorizes only the configured site for its administrator owner', async () => {
  const f = fixture();
  expect(await f.useCase.execute(W.SLUG)).toEqual(
    ok({ organizationId: 'organization', slug: W.SLUG }),
  );
  f.ports.organizations.get.mockResolvedValue(ok({ id: 'organization', role: 'MANAGER' }));
  expect((await f.useCase.execute(W.SLUG)).ok).toBe(false);
});
