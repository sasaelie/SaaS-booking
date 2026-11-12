import type { Result } from '../../lib/result';
import type { BookingStatus } from '../../config/constants';
export interface SimulationBooking {
  readonly id: string;
  readonly activityId: string;
  readonly activityName: string;
  readonly name: string;
  readonly email: string;
  readonly startsAt: string;
  readonly timezone: string;
  readonly status: BookingStatus;
  readonly amountCents: number;
  readonly priceCents: number;
  readonly currency: string;
  readonly paymentMode: string;
  readonly failure: boolean;
  readonly terms: string;
  readonly managementToken: string;
  readonly vouchers: readonly {
    readonly code: string;
    readonly amountCents: number;
    readonly expiresAt: string;
    readonly status: string;
  }[];
}
export interface SimulationRepositoryPort {
  count(): Promise<Result<number>>;
  list(): Promise<Result<readonly SimulationBooking[]>>;
  payment(bookingId: string, success: boolean): Promise<Result<void>>;
  delete(bookingId: string): Promise<Result<void>>;
}
