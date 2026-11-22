import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { BookingPublicationPort } from '../../ports/booking-publication.port';
import {
  BookingPublicationInput,
  PublishTestBookingInput,
} from '../../validation/booking-publication';
import { withPortalActor } from './actor';
export class BookingPublicationUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: BookingPublicationPort,
  ) {}
  read(raw: unknown) {
    return withPortalActor(this.identity, 'BookingPublication', async (actor) => {
      const input = BookingPublicationInput.safeParse(raw);
      return input.success
        ? this.repository.read(actor, input.data.organizationId)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'BookingPublication', 'input');
    });
  }
  publish(raw: unknown) {
    return withPortalActor(this.identity, 'BookingPublication', async (actor) => {
      const input = PublishTestBookingInput.safeParse(raw);
      return input.success
        ? this.repository.publish(actor, input.data.organizationId)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'BookingPublication', 'consent');
    });
  }
}
