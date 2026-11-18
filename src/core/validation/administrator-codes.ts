import { z } from 'zod';
import { SAAS } from '../../config/constants';
export const AdministratorOtpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/);
const password = z.string().min(1).max(SAAS.AUTH_MAX_PASSWORD);
export const AdministratorCodeCommands = [
  z.object({ action: z.literal('totp-prepare'), password }).strict(),
  z.object({ action: z.literal('totp-confirm'), code: AdministratorOtpSchema }).strict(),
  z.object({ action: z.literal('totp-verify'), code: AdministratorOtpSchema }).strict(),
  z.object({ action: z.literal('email-confirm'), code: AdministratorOtpSchema }).strict(),
  z.object({ action: z.literal('email-verify'), code: AdministratorOtpSchema }).strict(),
  z.object({ action: z.literal('email-prepare'), password }).strict(),
  z.object({ action: z.literal('email-send') }).strict(),
  z
    .object({ action: z.literal('code-remove'), method: z.enum(['totp', 'email']), password })
    .strict(),
] as const;
export const AdministratorCodeCommandSchema = z.discriminatedUnion(
  'action',
  AdministratorCodeCommands,
);
export type AdministratorCodeCommand = z.output<typeof AdministratorCodeCommandSchema>;
export const codeActions = new Set([
  'totp-prepare',
  'totp-confirm',
  'totp-verify',
  'email-prepare',
  'email-send',
  'email-confirm',
  'email-verify',
  'code-remove',
]);
export function isAdministratorCodeCommand(command: {
  readonly action: string;
}): command is AdministratorCodeCommand {
  return codeActions.has(command.action);
}
