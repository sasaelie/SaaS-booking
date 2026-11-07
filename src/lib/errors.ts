import { ERROR_CODES, type ErrorCode } from '../config/constants';
import { failAndLog } from './logger';
import { type AppError, type Result } from './result';
export function failure(code: ErrorCode, module: string, fn: string): Result<never> {
  return failAndLog({
    code,
    module,
    fn,
    cause: code,
    received: '[redacted]',
    expected: 'valid authorized operation',
  });
}
export function unexpected(module: string, fn: string): Result<never> {
  return failure(ERROR_CODES.INTERNAL_ERROR, module, fn);
}
export function errorValue(code: ErrorCode, module: string, fn: string): AppError {
  const result = failure(code, module, fn);
  if (!result.ok) return result.error;
  return {
    code,
    module,
    fn,
    cause: code,
    received: '[redacted]',
    expected: 'valid authorized operation',
  };
}
