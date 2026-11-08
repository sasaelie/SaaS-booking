import { MONEY } from '../../config/constants';
export type PortalAction =
  | 'update-activity'
  | 'publish-activity'
  | 'add-session'
  | 'record-bank-refund'
  | 'connect-stripe'
  | 'platform-stripe'
  | 'create-organization'
  | 'create-activity'
  | 'archive-activity'
  | 'settings'
  | 'grant-access'
  | 'suspend'
  | 'subscription';
function text(form: FormData, name: string) {
  return String(form.get(name) ?? '').trim();
}
export function cents(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  const [whole, fraction = ''] = normalized.split('.');
  return Number(whole) * MONEY.CENTS_PER_UNIT + Number(fraction.padEnd(MONEY.DECIMAL_PLACES, '0'));
}
function activityInput(form: FormData, organizationId: string) {
  const weekly = form.get('scheduleKind') === 'WEEKLY';
  const days = form.getAll('dayOfWeek');
  const starts = form.getAll('startTimeLocal');
  const ends = form.getAll('endTimeLocal');
  const capacities = form.getAll('slotCapacity');
  const schedule = weekly
    ? {
        kind: 'WEEKLY',
        slots: days.map((day, index) => ({
          dayOfWeek: Number(day),
          startTimeLocal: String(starts[index] ?? ''),
          endTimeLocal: String(ends[index] ?? ''),
          capacity: Number(capacities[index]),
        })),
      }
    : {
        kind: 'MANUAL',
        date: text(form, 'date'),
        endDate: text(form, 'endDate') || text(form, 'date'),
        start: text(form, 'start'),
        end: text(form, 'end'),
        capacity: Number(form.get('capacity')),
      };
  return {
    organizationId,
    name: text(form, 'name'),
    description: text(form, 'description'),
    priceCents: cents(text(form, 'price')),
    audiencePolicy: text(form, 'audiencePolicy'),
    paymentMode: text(form, 'paymentMode'),
    requirePhone: form.has('requirePhone'),
    bookingWindowWeeks: Number(form.get('bookingWindowWeeks')),
    noticeHoursForVoucher: Number(form.get('noticeHoursForVoucher')),
    voucherValidityMonths: Number(form.get('voucherValidityMonths')),
    schedule,
  };
}

function settingsInput(form: FormData, organizationId: string) {
  return {
    organizationId,
    name: text(form, 'name'),
    bankIban: text(form, 'bankIban') || null,
    bankAccountName: text(form, 'bankAccountName') || null,
    theme: text(form, 'theme'),
    autoDeleteBankProof: form.has('autoDeleteBankProof'),
  };
}
function managementInput(action: PortalAction, form: FormData, organizationId: string) {
  switch (action) {
    case 'connect-stripe':
    case 'platform-stripe':
      return organizationId;
    case 'publish-activity':
    case 'archive-activity':
      return { organizationId, activityId: text(form, 'activityId') };
    case 'update-activity': {
      const { schedule, ...base } = activityInput(form, organizationId);
      void schedule;
      return { ...base, activityId: text(form, 'activityId') };
    }
    case 'add-session':
      return {
        organizationId,
        activityId: text(form, 'activityId'),
        schedule: activityInput(form, organizationId).schedule,
      };
    case 'record-bank-refund':
      return {
        organizationId,
        bookingId: text(form, 'bookingId'),
        reference: text(form, 'reference'),
      };
    default:
      return undefined;
  }
}
export function formCommand(action: PortalAction, form: FormData, organizationId = '') {
  const managed = managementInput(action, form, organizationId);
  if (managed !== undefined) return { action, input: managed };
  let input: unknown;
  switch (action) {
    case 'create-organization':
      input = {
        name: text(form, 'name'),
        slug: text(form, 'slug'),
        kind: text(form, 'kind'),
        timezone: text(form, 'timezone'),
      };
      break;
    case 'create-activity':
      input = activityInput(form, organizationId);
      break;
    case 'settings':
      input = settingsInput(form, organizationId);
      break;
    case 'grant-access':
      input = { organizationId, complimentary: text(form, 'value') === 'true' };
      break;
    case 'suspend':
      input = { organizationId, suspended: text(form, 'value') === 'true' };
      break;
    case 'subscription':
      input = { organizationId, operation: text(form, 'operation') };
      break;
  }
  return { action, input };
}
