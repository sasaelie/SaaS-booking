import { z } from 'zod';
import { PLATFORM_REPORTING as REPORT } from '../../config/platform-reporting';
import { ADMIN_WORKSPACE } from '../../config/administration-workspace';
import { SAAS, TIME } from '../../config/constants';
function date(offset: number) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: REPORT.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  return new Date(Date.parse(`${today}T12:00:00Z`) - offset * TIME.DAY_MS)
    .toISOString()
    .slice(0, REPORT.ISO_DATE_LENGTH);
}
export const PlatformReportSchema = z
  .object({
    from: z.iso.date().default(() => date(REPORT.DEFAULT_DAYS - 1)),
    to: z.iso.date().default(() => date(0)),
    page: z.coerce.number().int().min(1).max(ADMIN_WORKSPACE.PAGE_MAX).default(1),
    pageSize: z.coerce
      .number()
      .refine((value) => ADMIN_WORKSPACE.PAGE_SIZES.some((size) => size === value))
      .default(SAAS.PAGE_SIZE),
    search: z.string().trim().max(SAAS.SEARCH_MAX).default(''),
    organizationId: z.union([z.uuid(), z.literal('')]).default(''),
    scope: z.enum(['', 'PLATFORM', 'ORGANIZER', 'CREDIT']).default(''),
    kind: z.string().max(SAAS.SEARCH_MAX).default(''),
    status: z.enum(['', 'PENDING', 'RECONCILED', 'HISTORICAL']).default(''),
    view: z
      .enum(['journal', 'rapprochements', 'documents', 'ajustements', 'parametres'])
      .default('journal'),
  })
  .refine(
    (value) =>
      value.from <= value.to &&
      Date.parse(value.to) - Date.parse(value.from) < REPORT.MAX_DAYS * TIME.DAY_MS,
    'Période invalide ou supérieure à un an.',
  );
export type PlatformReportFilter = z.output<typeof PlatformReportSchema>;
export type PlatformReportInput = PlatformReportFilter & {
  readonly start: Date;
  readonly end: Date;
};
