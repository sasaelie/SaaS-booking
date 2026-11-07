// src/lib/logger.ts
import { createAppError, err, type AppError, type Result } from './result';

export interface LogEntryInput {
  readonly module: string;
  readonly fn: string;
  readonly cause: string;
  readonly received: unknown;
  readonly expected: string;
}
function serializeValue(val: unknown): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  try {
    return JSON.stringify(val);
  } catch {
    return '[Unserializable Object]';
  }
}
export function formatStructuredLog(input: LogEntryInput): string {
  const receivedStr = serializeValue(input.received);
  return `[${input.module} :: ${input.fn}] ${input.cause} | reçu: ${receivedStr} | attendu: ${input.expected}`;
}
export const logger = {
  error(input: LogEntryInput): string {
    const message = formatStructuredLog(input);
    console.error(message);
    return message;
  },
  warn(input: LogEntryInput): string {
    const message = formatStructuredLog(input);
    console.warn(message);
    return message;
  },
  info(input: LogEntryInput): string {
    const message = formatStructuredLog(input);
    console.info(message);
    return message;
  },
} as const;
export function failAndLog(params: AppError): Result<never, AppError> {
  logger.error({
    module: params.module,
    fn: params.fn,
    cause: params.cause,
    received: params.received,
    expected: params.expected,
  });
  return err(createAppError(params));
}
