import type { Result } from '../../lib/result';
export interface RateLimitPort {
  accept(key: string): Promise<Result<void>>;
}
