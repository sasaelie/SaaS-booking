import { z } from 'zod';
import { TIME } from '../config/constants';
import { SECURITY } from '../config/security';
const finding = z.object({ name: z.string(), url: z.url() });
const vulnerability = z.object({
  severity: z.enum(['info', 'low', 'moderate', 'high', 'critical']),
  via: z.array(z.union([z.string(), finding])).min(1),
});
const auditSchema = z.object({
  metadata: z.object({ vulnerabilities: z.object({ total: z.number().int().nonnegative() }) }),
  vulnerabilities: z.record(z.string(), vulnerability),
  error: z.unknown().optional(),
});
const reviewsSchema = z.array(
  z
    .object({
      advisory: z.string().regex(/^GHSA-[a-z0-9-]+$/),
      reviewedOn: z.iso.date(),
      expires: z.iso.date(),
      reason: z.string().min(SECURITY.ADVISORY_REASON_MIN),
      scope: z.literal('build-only'),
    })
    .strict(),
);
type Vulnerabilities = z.output<typeof auditSchema>['vulnerabilities'];
export function reviewDependencyAudit(raw: unknown, rawReviews: unknown, now: Date) {
  const audit = auditSchema.safeParse(raw),
    reviews = reviewsSchema.safeParse(rawReviews);
  if (
    !audit.success ||
    !reviews.success ||
    audit.data.error !== undefined ||
    (audit.data.metadata.vulnerabilities.total > 0 &&
      !Object.keys(audit.data.vulnerabilities).length)
  )
    return { valid: false, unreviewed: ['AUDIT_UNAVAILABLE'], reviewed: [] as string[] };
  const high = Object.entries(audit.data.vulnerabilities).filter(
    ([, v]) => v.severity === 'high' || v.severity === 'critical',
  );
  const ids = [
    ...new Set(high.flatMap(([name]) => advisoryIds(name, audit.data.vulnerabilities, new Set()))),
  ];
  const approved = new Set(
    reviews.data
      .filter((r) => {
        const start = Date.parse(r.reviewedOn),
          end = Date.parse(r.expires);
        return (
          start <= now.getTime() &&
          now.getTime() < end + TIME.DAY_MS &&
          end >= start &&
          end - start <= SECURITY.ADVISORY_REVIEW_DAYS * TIME.DAY_MS
        );
      })
      .map((r) => r.advisory),
  );
  const unreviewed = ids.filter((id) => !approved.has(id));
  return {
    valid: unreviewed.length === 0,
    unreviewed,
    reviewed: ids.filter((id) => approved.has(id)),
  };
}
function advisoryIds(name: string, all: Vulnerabilities, visited: Set<string>): string[] {
  if (visited.has(name)) return [`UNRESOLVED:${name}`];
  visited.add(name);
  const entry = all[name];
  if (!entry) return [`UNRESOLVED:${name}`];
  return entry.via.flatMap((v) => {
    if (typeof v === 'string') return advisoryIds(v, all, new Set(visited));
    const url = new URL(v.url);
    return [
      url.hostname === 'github.com' && url.pathname.startsWith('/advisories/')
        ? (url.pathname.split('/').at(-1) ?? v.url)
        : v.url,
    ];
  });
}
