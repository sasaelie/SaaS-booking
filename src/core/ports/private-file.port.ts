import type { Result } from '../../lib/result';
export interface PrivateFileTokenPort {
  sign(key: string, expiresInSeconds: number): Promise<Result<string>>;
  verify(token: string): Promise<Result<string>>;
}
