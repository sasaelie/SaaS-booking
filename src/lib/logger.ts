import { createAppError, err, type AppError, type Result } from './result';
export interface LogEntryInput {
  readonly module: string;
  readonly fn: string;
  readonly cause: string;
  readonly received: unknown;
  readonly expected: string;
}
function singleLine(value: string): string {
  return value.replace(/[\r\n\u2028\u2029|]/g, ' ');
}
export function formatStructuredLog(input: LogEntryInput): string {
  return `[${singleLine(input.module)} :: ${singleLine(input.fn)}] ${singleLine(input.cause)} | reçu: [redacted] | attendu: ${singleLine(input.expected)}`;
}
function write(level: 'error' | 'warn' | 'info', input: LogEntryInput): string {
  const message = formatStructuredLog(input);
  console[level](message);
  return message;
}
export const logger = {
  error: (input: LogEntryInput) => write('error', input),
  warn: (input: LogEntryInput) => write('warn', input),
  info: (input: LogEntryInput) => write('info', input),
};
export function failAndLog(params: AppError): Result<never> {
  const safe = createAppError({ ...params, received: '[redacted]' });
  logger.error(safe);
  return err(safe);
}
