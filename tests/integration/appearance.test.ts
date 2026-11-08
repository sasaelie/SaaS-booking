import { expect, it } from 'vitest';
import { portalFixture } from './portal-fixtures';
import { required } from '../../src/adapters/db/transaction';
import { AppearanceSchema } from '../../src/core/validation/appearance';
it('stores independent colors only for the organization owner', async () => {
  const own = await portalFixture();
  const other = await portalFixture();
  const input = { organizationId: own.organizationId, organizerHue: 15, participantHue: 220 };
  expect(AppearanceSchema.safeParse({ ...input, organizerHue: 360 }).success).toBe(false);
  expect((await own.repository.updateAppearance(other.actor, input)).ok).toBe(false);
  required(await own.repository.updateAppearance(own.actor, input));
  const saved = required(await own.repository.getOrganization(own.actor, own.organizationId));
  expect(saved.organizerHue).toBe(15);
  expect(saved.participantHue).toBe(220);
  const untouched = required(
    await other.repository.getOrganization(other.actor, other.organizationId),
  );
  expect(untouched.organizerHue).toBeNull();
  required(
    await own.repository.updateAppearance(own.actor, {
      ...input,
      organizerHue: null,
      participantHue: null,
    }),
  );
  expect(
    required(await own.repository.getOrganization(own.actor, own.organizationId)).participantHue,
  ).toBeNull();
});
