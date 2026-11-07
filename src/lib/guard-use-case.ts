import { unexpected } from './errors';
import type { Result } from './result';
export async function guardUseCase<T extends Result<unknown>>(
  module: string,
  fn: string,
  operation: () => Promise<T>,
): Promise<T | Result<never>> {
  try {
    return await operation();
  } catch {
    return unexpected(module, fn);
  }
}
