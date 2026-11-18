import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@simplewebauthn/server';
import type { PasskeyGatewayPort, StoredPasskey } from '../../core/ports/administrator-security';
import type { PortalActor } from '../../core/ports/portal-models';
import type {
  PasskeyRegistration,
  PasskeyAuthentication,
} from '../../core/validation/administrator-security';
import { PasskeyTransportsSchema } from '../../core/validation/administrator-security';
import { ADMIN_SECURITY as C } from '../../config/administrator-security';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
export class SimpleWebAuthnAdapter implements PasskeyGatewayPort {
  private readonly origin: string;
  private readonly rpID: string;
  constructor(appUrl: string) {
    const url = new URL(appUrl);
    this.origin = url.origin;
    this.rpID = url.hostname;
  }
  async registerOptions(actor: PortalActor, keys: readonly StoredPasskey[]) {
    const options = await generateRegistrationOptions({
      rpName: C.RP_NAME,
      rpID: this.rpID,
      userID: new TextEncoder().encode(actor.id),
      userName: actor.email,
      userDisplayName: actor.name,
      timeout: C.TIMEOUT_MS,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        userVerification: 'required',
      },
      excludeCredentials: keys.map((k) => ({
        id: k.id,
        transports: PasskeyTransportsSchema.parse(k.transports),
      })),
    });
    return { challenge: options.challenge, options: { ...options } };
  }
  async authenticateOptions(keys: readonly StoredPasskey[]) {
    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      timeout: C.TIMEOUT_MS,
      userVerification: 'required',
      allowCredentials: keys.map((k) => ({
        id: k.id,
        transports: PasskeyTransportsSchema.parse(k.transports),
      })),
    });
    return { challenge: options.challenge, options: { ...options } };
  }
  async register(response: PasskeyRegistration, challenge: string) {
    try {
      const result = await verifyRegistrationResponse({
        response: response as RegistrationResponseJSON,
        expectedChallenge: challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: true,
        requireUserPresence: true,
      });
      if (!result.verified || !result.registrationInfo)
        return failure(ERROR_CODES.UNAUTHORIZED, 'Passkey', 'registration');
      const credential = result.registrationInfo.credential;
      return ok({
        id: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
        transports: credential.transports ?? [],
      });
    } catch {
      return failure(ERROR_CODES.UNAUTHORIZED, 'Passkey', 'registration');
    }
  }
  async authenticate(response: PasskeyAuthentication, challenge: string, key: StoredPasskey) {
    try {
      const result = await verifyAuthenticationResponse({
        response: response as AuthenticationResponseJSON,
        expectedChallenge: challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: true,
        credential: {
          id: key.id,
          publicKey: new Uint8Array(Buffer.from(key.publicKey, 'base64url')),
          counter: key.counter,
          transports: PasskeyTransportsSchema.parse(key.transports),
        },
      });
      return result.verified
        ? ok(result.authenticationInfo.newCounter)
        : failure(ERROR_CODES.UNAUTHORIZED, 'Passkey', 'authentication');
    } catch {
      return failure(ERROR_CODES.UNAUTHORIZED, 'Passkey', 'authentication');
    }
  }
}
