import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { logger } from '../src/lib/logger';
const forbidden =
  /node_modules\/(?:vitest|vite|picomatch|tinyglobby|fdir|fast-glob|micromatch)\/.*\.(?:js|mjs|cjs)$/;
async function files(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((e) => e.name !== 'dev')
      .map((e) =>
        e.isDirectory()
          ? files(path.join(directory, e.name))
          : Promise.resolve(e.name.endsWith('.nft.json') ? [path.join(directory, e.name)] : []),
      ),
  );
  return nested.flat();
}
async function main() {
  const manifests = await files('.next');
  if (!manifests.length) throw Error('Production traces required');
  const violations: { manifest: string; dependency: string }[] = [];
  for (const manifest of manifests) {
    const data: unknown = JSON.parse(await readFile(manifest, 'utf8'));
    if (
      typeof data !== 'object' ||
      data === null ||
      !('files' in data) ||
      !Array.isArray(data.files)
    )
      throw Error('Invalid trace');
    for (const file of data.files)
      if (typeof file === 'string' && forbidden.test(file))
        violations.push({ manifest, dependency: file });
  }
  await mkdir('qa-results', { recursive: true });
  await writeFile(
    'qa-results/runtime-traces.json',
    JSON.stringify({ manifests: manifests.length, violations }, null, 2),
  );
  console.info(
    JSON.stringify({ manifests: manifests.length, forbiddenBuildDependencies: violations.length }),
  );
  if (violations.length) process.exitCode = 1;
}
void main().catch(() => {
  logger.error({
    module: 'SecurityAudit',
    fn: 'traces',
    cause: 'RUNTIME_TRACE_UNAVAILABLE',
    received: null,
    expected: 'production trace manifests without development-only executable dependencies',
  });
  process.exitCode = 1;
});
