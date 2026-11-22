import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
import type { SessionEditInput } from '../validation/session-edit';
export interface SessionEditCommand extends SessionEditInput {
  readonly newStartsAt: Date;
  readonly newEndsAt: Date;
}
export type SessionEditOutcome =
  | { readonly status: 'SESSION_UPDATED'; readonly sessionStartsAt: string }
  | {
      readonly status: 'CONFIRMATION_REQUIRED';
      readonly affectedBookingsCount: number;
      readonly confirmationHash: string;
    };
export interface SessionEditPort {
  update(actor: PortalActor, command: SessionEditCommand): Promise<Result<SessionEditOutcome>>;
}
