import { expect, it } from 'vitest';
import { reviewDependencyAudit } from '../../src/lib/dependency-security';
const advisory = 'GHSA-fc5q-39xc-vjpf';
const report = {
  metadata: { vulnerabilities: { total: 2 } },
  vulnerabilities: {
    parent: { severity: 'high', via: ['picomatch'] },
    picomatch: {
      severity: 'high',
      via: [{ name: 'picomatch', url: `https://github.com/advisories/${advisory}` }],
    },
  },
};
const reviews = [
  {
    advisory,
    reviewedOn: '2026-11-18',
    expires: '2026-12-02',
    reason: 'Unpatched build dependency; reviewed limited exposure and pending upstream fix.',
    scope: 'build-only',
  },
];
it('accepts only the individually reviewed, time bounded advisory rather than ignoring high severity findings', () => {
  expect(reviewDependencyAudit(report, reviews, new Date('2026-11-20'))).toEqual({
    valid: true,
    unreviewed: [],
    reviewed: [advisory],
  });
  expect(reviewDependencyAudit(report, [], new Date('2026-11-20')).valid).toBe(false);
});
it('fails after review expiration and refuses indefinitely extended exceptions', () => {
  expect(reviewDependencyAudit(report, reviews, new Date('2026-12-03')).valid).toBe(false);
  expect(
    reviewDependencyAudit(
      report,
      [{ ...reviews[0], expires: '2027-12-02' }],
      new Date('2026-11-20'),
    ).valid,
  ).toBe(false);
});
it('fails closed when the registry request fails or its result is incomplete', () => {
  expect(reviewDependencyAudit({ error: { code: 'NETWORK' } }, reviews, new Date()).valid).toBe(
    false,
  );
  expect(
    reviewDependencyAudit(
      { metadata: { vulnerabilities: { total: 1 } }, vulnerabilities: {} },
      reviews,
      new Date(),
    ).valid,
  ).toBe(false);
});
it('does not let another advisory inherit the existing review', () => {
  const changed = {
    ...report,
    vulnerabilities: {
      picomatch: {
        severity: 'critical',
        via: [{ name: 'picomatch', url: 'https://github.com/advisories/GHSA-new-issue' }],
      },
    },
  };
  expect(reviewDependencyAudit(changed, reviews, new Date('2026-11-20')).unreviewed).toEqual([
    'GHSA-new-issue',
  ]);
});
it('fails closed for unresolved or cyclic vulnerability chains', () => {
  const cycle = {
    metadata: { vulnerabilities: { total: 1 } },
    vulnerabilities: {
      one: { severity: 'high', via: ['two'] },
      two: { severity: 'high', via: ['one'] },
    },
  };
  expect(reviewDependencyAudit(cycle, reviews, new Date('2026-11-20')).valid).toBe(false);
});
