// src/lib/result.ts
import type { ErrorCode } from '../config/constants';

export interface AppError {
  readonly code: ErrorCode;
  readonly module: string;
  readonly fn: string;
  readonly cause: string;
  readonly received: string;
  readonly expected: string;
}

export type Result<T, E = AppError> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}
export function err<E = AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}
export function createAppError(params: AppError): AppError {
  return {
    code: params.code,
    module: params.module,
    fn: params.fn,
    cause: params.cause,
    received: params.received,
    expected: params.expected,
  };
}
