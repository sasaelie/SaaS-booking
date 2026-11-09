import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { z } from 'zod';
const vitest = z.object({
  numTotalTests: z.number(),
  numPassedTests: z.number(),
  numFailedTests: z.number(),
  numPendingTests: z.number(),
  success: z.boolean(),
});
const browser = z.object({
  stats: z.object({
    expected: z.number(),
    unexpected: z.number(),
    flaky: z.number(),
    skipped: z.number(),
  }),
});
type Summary = {
  suite: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  complete: boolean;
};
async function readSuite(suite: string): Promise<Summary> {
  try {
    const raw: unknown = JSON.parse(await readFile(`qa-results/${suite}.json`, 'utf8'));
    if (suite === 'browser') {
      const { stats: value } = browser.parse(raw);
      return {
        suite,
        total: value.expected + value.unexpected + value.flaky + value.skipped,
        passed: value.expected,
        failed: value.unexpected,
        skipped: value.skipped,
        flaky: value.flaky,
        complete: true,
      };
    }
    const value = vitest.parse(raw);
    return {
      suite,
      total: value.numTotalTests,
      passed: value.numPassedTests,
      failed: value.numFailedTests,
      skipped: value.numPendingTests,
      flaky: 0,
      complete: value.success,
    };
  } catch {
    return { suite, total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0, complete: false };
  }
}
async function main() {
  const results = await Promise.all(['unit', 'integration', 'browser'].map(readSuite));
  const valid = results.every(
    (suite) =>
      suite.complete &&
      suite.total > 0 &&
      suite.passed === suite.total &&
      suite.failed === 0 &&
      suite.skipped === 0 &&
      suite.flaky === 0,
  );
  const { revision, dirty } = sourceRevision();
  const details = {
    createdAt: new Date().toISOString(),
    revision,
    worktreeDirty: dirty,
    valid,
    results,
  };
  await mkdir('qa-results', { recursive: true });
  await writeFile('qa-results/summary.json', JSON.stringify(details, null, 2));
  const rows = results
    .map(
      (suite) =>
        `| ${suite.suite} | ${suite.total} | ${suite.passed} | ${suite.failed} | ${suite.skipped} | ${suite.flaky} | ${suite.complete ? 'présent' : 'incomplet'} |`,
    )
    .join('\n');
  await writeFile(
    'qa-results/summary.md',
    `# Résultats automatisés\n\nRévision : ${revision}. Modifications locales : ${dirty === null ? 'inconnu' : dirty ? 'oui' : 'non'}.\n\n| Suite | Total | Réussis | Échecs | Ignorés | Instables | Rapport |\n|---|---:|---:|---:|---:|---:|---|\n${rows}\n\n${valid ? 'Toutes les suites ont réussi sans test ignoré ou instable.' : 'Résultat incomplet ou échec : consulter les rapports détaillés.'}\n\nCette synthèse ne certifie pas les prestataires externes, le déploiement, la charge en production ni la conformité juridique.\n`,
  );
  console.info(`Rapport qa-results/summary.md : ${valid ? 'PASS' : 'INCOMPLETE_OR_FAILED'}`);
  if (!valid) process.exitCode = 1;
}
void main().catch(() => {
  console.error('Synthèse de tests indisponible.');
  process.exitCode = 1;
});

function sourceRevision(): { revision: string; dirty: boolean | null } {
  try {
    return {
      revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      dirty: Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()),
    };
  } catch {
    console.warn('Métadonnées Git indisponibles ; les résultats de tests restent détaillés.');
    return { revision: process.env['GITHUB_SHA'] ?? 'inconnue', dirty: null };
  }
}
