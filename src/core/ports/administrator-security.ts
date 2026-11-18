import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
import type {
  AdministratorSecurityCommand,
  PasskeyRegistration,
  PasskeyAuthentication,
} from '../validation/administrator-security';
export interface AdministratorSecurityState {
  readonly enabled: boolean;
  readonly verified: boolean;
  readonly fresh: boolean;
  readonly recoveryRemaining: number;
  readonly credentials: readonly {
    readonly id: string;
    readonly label: string;
    readonly createdAt: string;
  }[];
}
export interface AdministratorSecurityReply {
  readonly options?: Record<string, unknown>;
  readonly recoveryCodes?: readonly string[];
}
export interface StoredPasskey {
  readonly id: string;
  readonly publicKey: string;
  readonly counter: number;
  readonly transports: readonly string[];
}
export interface PasskeyGatewayPort {
  registerOptions(
    actor: PortalActor,
    keys: readonly StoredPasskey[],
  ): Promise<{ challenge: string; options: Record<string, unknown> }>;
  authenticateOptions(
    keys: readonly StoredPasskey[],
  ): Promise<{ challenge: string; options: Record<string, unknown> }>;
  register(response: PasskeyRegistration, challenge: string): Promise<Result<StoredPasskey>>;
  authenticate(
    response: PasskeyAuthentication,
    challenge: string,
    key: StoredPasskey,
  ): Promise<Result<number>>;
}
export interface AdministratorSecurityRepositoryPort {
  read(actor: PortalActor): Promise<Result<AdministratorSecurityState>>;
  mutate(
    actor: PortalActor,
    command: AdministratorSecurityCommand,
  ): Promise<Result<AdministratorSecurityReply>>;
}
export interface PasswordProofPort {
  verify(password: string): Promise<Result<void>>;
}
