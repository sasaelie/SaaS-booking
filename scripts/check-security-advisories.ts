import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { logger } from '../src/lib/logger';
import { reviewDependencyAudit } from '../src/lib/dependency-security';
async function main() {
  const run = promisify(execFile);
  let output: string;
  try {
    output = (await run('npm', ['audit', '--json'])).stdout;
  } catch (error: unknown) {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('stdout' in error) ||
      typeof error.stdout !== 'string'
    )
      throw Error('Dependency audit unavailable');
    output = error.stdout;
  }
  const raw: unknown = JSON.parse(output),
    reviews: unknown = JSON.parse(await readFile('security/advisory-reviews.json', 'utf8'));
  const result = reviewDependencyAudit(raw, reviews, new Date());
  await mkdir('qa-results', { recursive: true });
  await writeFile('qa-results/dependency-audit.json', output);
  await writeFile('qa-results/dependency-review.json', JSON.stringify(result, null, 2));
  console.info(JSON.stringify(result));
  if (!result.valid) process.exitCode = 1;
}
void main().catch(() => {
  logger.error({
    module: 'SecurityAudit',
    fn: 'check',
    cause: 'AUDIT_UNAVAILABLE',
    received: null,
    expected: 'valid registry audit and time bounded reviews',
  });
  process.exitCode = 1;
});
