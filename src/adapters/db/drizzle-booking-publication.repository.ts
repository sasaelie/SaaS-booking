import { sql } from 'drizzle-orm';
import { ERROR_CODES } from '../../config/constants';
import { STAGING } from '../../config/staging';
import type { Environment } from '../../config/env';
import type { BookingPublicationPort } from '../../core/ports/booking-publication.port';
import type { PortalActor } from '../../core/ports/portal-models';
import { ok } from '../../lib/result';
import { failure } from '../../lib/errors';
import type { DrizzlePgDb } from './client';
import { atomic, rows } from './transaction';
import { requireMembership } from './portal/authorization';
export class DrizzleBookingPublicationRepository implements BookingPublicationPort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly env: Environment,
  ) {}
  read(actor: PortalActor, organizationId: string) {
    return atomic(this.db, 'BookingPublication', async (tx) => {
      await requireMembership(tx, actor, organizationId);
      const configured =
        this.env.APP_ENVIRONMENT === STAGING.MODE && Boolean(this.env.PUBLIC_BOOKING_URL);
      const [row] = configured
        ? await rows<{ published: boolean }>(
            tx,
            sql`SELECT enabled AS published FROM booking_public_test.publication WHERE organization_id=${organizationId}`,
          )
        : [];
      const published = Boolean(row?.published);
      return ok({
        appUrl: published
          ? (this.env.PUBLIC_BOOKING_URL ?? this.env.NEXT_PUBLIC_APP_URL)
          : this.env.NEXT_PUBLIC_APP_URL,
        published,
        activationRequired: configured && !published,
      });
    });
  }
  publish(actor: PortalActor, organizationId: string) {
    return atomic(this.db, 'BookingPublication', async (tx) => {
      await requireMembership(tx, actor, organizationId, true);
      if (this.env.APP_ENVIRONMENT !== STAGING.MODE || !this.env.PUBLIC_BOOKING_URL)
        return failure(ERROR_CODES.UNAUTHORIZED, 'BookingPublication', 'environment');
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${organizationId}))`);
      await tx.execute(sql`INSERT INTO booking_public_test.publication(organization_id,slug,enabled)
        SELECT id,slug,true FROM organizations WHERE id=${organizationId}
        ON CONFLICT(organization_id) DO UPDATE SET slug=excluded.slug,enabled=true`);
      await tx.execute(
        sql`SELECT booking_public_test.publish_organization(${organizationId}::uuid)`,
      );
      return ok(undefined);
    });
  }
}
