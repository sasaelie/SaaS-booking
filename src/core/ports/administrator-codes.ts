import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
import type { AdministratorCodeCommand } from '../validation/administrator-codes';
import type { AdministratorSecurityReply } from './administrator-security';
export interface AdministratorOtpPort {
  prepareTotp(userId: string): Promise<Result<{ secret: string; ciphertext: string }>>;
  verifyTotp(
    userId: string,
    ciphertext: string,
    code: string,
    lastStep: number,
  ): Promise<Result<number>>;
  prepareEmail(actor: PortalActor, purpose: string): { code: string; nonce: string; hash: string };
  verifyEmail(
    actor: PortalActor,
    purpose: string,
    code: string,
    nonce: string,
    hash: string,
  ): boolean;
}
export interface AdministratorCodeMailPort {
  readonly available: boolean;
  send(actor: PortalActor, code: string, idempotencyKey: string): Promise<Result<void>>;
}
export interface AdministratorCodesRepositoryPort {
  readonly mailAvailable: boolean;
  mutate(
    actor: PortalActor,
    command: AdministratorCodeCommand,
  ): Promise<Result<AdministratorSecurityReply>>;
}
