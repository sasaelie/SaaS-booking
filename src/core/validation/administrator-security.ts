import { z } from 'zod';
import { ADMIN_SECURITY as C } from '../../config/administrator-security';
import { SAAS } from '../../config/constants';
const encoded = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .regex(/^[A-Za-z0-9_-]+={0,2}$/);
export const PasskeyTransportsSchema = z
  .array(z.enum(['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb']))
  .max(C.TRANSPORT_MAX);
const base = {
  id: encoded(C.ID_MAX),
  rawId: encoded(C.ID_MAX),
  type: z.literal('public-key'),
  authenticatorAttachment: z.enum(['platform', 'cross-platform']).optional(),
  clientExtensionResults: z.record(z.string(), z.unknown()),
};
export const PasskeyRegistrationSchema = z
  .object({
    ...base,
    response: z
      .object({
        clientDataJSON: encoded(C.CLIENT_DATA_MAX),
        attestationObject: encoded(C.RESPONSE_MAX),
        transports: PasskeyTransportsSchema.optional(),
        publicKeyAlgorithm: z.number().int().optional(),
        publicKey: encoded(C.RESPONSE_MAX).optional(),
        authenticatorData: encoded(C.RESPONSE_MAX).optional(),
      })
      .strict(),
  })
  .strict();
export const PasskeyAuthenticationSchema = z
  .object({
    ...base,
    response: z
      .object({
        clientDataJSON: encoded(C.CLIENT_DATA_MAX),
        authenticatorData: encoded(C.RESPONSE_MAX),
        signature: encoded(C.RESPONSE_MAX),
        userHandle: encoded(C.ID_MAX).nullable().optional(),
      })
      .strict(),
  })
  .strict();
export const RecoveryCodeSchema = z
  .string()
  .trim()
  .max(C.CODE_INPUT_MAX)
  .transform((v) => v.replace(/[\s-]/g, '').toUpperCase())
  .pipe(z.string().regex(/^[A-F0-9]{32}$/));
const password = z.string().min(1).max(SAAS.AUTH_MAX_PASSWORD);
export const AdministratorSecurityCommandSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('register-options'),
      password,
      label: z.string().trim().min(1).max(C.LABEL_MAX),
    })
    .strict(),
  z.object({ action: z.literal('register-finish'), response: PasskeyRegistrationSchema }).strict(),
  z.object({ action: z.literal('authenticate-options') }).strict(),
  z
    .object({ action: z.literal('authenticate-finish'), response: PasskeyAuthenticationSchema })
    .strict(),
  z.object({ action: z.enum(['recover', 'activate']), code: RecoveryCodeSchema }).strict(),
  z.object({ action: z.enum(['rotate-recovery', 'disable']), password }).strict(),
  z.object({ action: z.literal('remove'), password, credentialId: encoded(C.ID_MAX) }).strict(),
]);
export type AdministratorSecurityCommand = z.output<typeof AdministratorSecurityCommandSchema>;
export type PasskeyRegistration = z.output<typeof PasskeyRegistrationSchema>;
export type PasskeyAuthentication = z.output<typeof PasskeyAuthenticationSchema>;
