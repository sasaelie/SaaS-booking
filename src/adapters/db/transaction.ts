import type { SQL } from 'drizzle-orm';
import type { DrizzlePgDb } from './client';
import { failAndLog } from '../../lib/logger';
import { unexpected } from '../../lib/errors';
import type { AppError, Result } from '../../lib/result';
export type Transaction = Parameters<Parameters<DrizzlePgDb['transaction']>[0]>[0];
export type Executor = DrizzlePgDb | Transaction;
export class DatabaseFailure extends Error {
  constructor(readonly appError: AppError) {
    super(appError.code);
  }
}
export function required<T>(result: Result<T>): T {
  if (!result.ok) throw new DatabaseFailure(result.error);
  return result.value;
}
export async function atomic<T>(
  db: DrizzlePgDb,
  module: string,
  action: (tx: Transaction) => Promise<Result<T>>,
): Promise<Result<T>> {
  try {
    return await db.transaction(async (tx) => {
      const result = await action(tx);
      required(result);
      return result;
    });
  } catch (error: unknown) {
    return error instanceof DatabaseFailure ? failAndLog(error.appError) : logUnexpected(module);
  }
}
function logUnexpected(module: string): Result<never> {
  const result = unexpected(module, 'transaction');
  if (!result.ok) return failAndLog(result.error);
  return result;
}
export async function rows<T extends Record<string, unknown>>(
  executor: Executor,
  query: SQL,
): Promise<readonly T[]> {
  const result = await executor.execute<T>(query);
  return result.rows as readonly T[];
}
