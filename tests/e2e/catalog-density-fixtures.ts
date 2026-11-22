import sharp from 'sharp';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DrizzlePortalRepository } from '../../src/adapters/db/drizzle-portal.repository';
import { required } from '../../src/adapters/db/transaction';
import { browserDatabase, browserSpace } from './portal-fixtures';
export const catalogPlacement = { title: { x: 18, y: 12 }, price: { x: 78, y: 88 } };
const names = [
  'Les rencontres des couturières',
  'Couture débutants et amateurs',
  'Couture pro',
  'Création textile : une parenthèse pour réaliser votre premier projet à votre rythme',
  'Réparer et transformer ses vêtements',
  'Broderie créative',
  'Patronage et coupe sur mesure',
  'Un atelier de couture partagé',
];
export async function densitySpace(count: number, photo = true) {
  const space = await browserSpace();
  const repository = new DrizzlePortalRepository(drizzle(browserDatabase()));
  const activities = [{ id: space.activityId, name: names[0] ?? 'Atelier', price: '25,00' }];
  await browserDatabase().query('UPDATE activities SET name=$2 WHERE id=$1', [
    space.activityId,
    names[0],
  ]);
  for (let i = 1; i < count; i++) {
    const priceCents = i === 1 ? 0 : i === 2 ? 3175 : 2500;
    const input = additionalActivity(
      space.organizationId,
      space.date,
      names[i] ?? 'Atelier',
      priceCents,
    );
    const created = required(await repository.createActivity(space.actor, input));
    activities.push({
      id: created.activityId,
      name: input.name,
      price: i === 1 ? '0,00' : i === 2 ? '31,75' : '25,00',
    });
  }
  await setCatalogBranding(space.organizationId, photo);
  return { ...space, activities };
}
function additionalActivity(organizationId: string, date: Date, name: string, priceCents: number) {
  return {
    organizationId,
    name,
    priceCents,
    description:
      'Un atelier pour découvrir, apprendre et partager un moment créatif. Tout le détail de cette activité reste disponible dans sa fiche complète.',
    audiencePolicy: 'ALL_PUBLIC' as const,
    paymentMode: 'NONE' as const,
    requirePhone: false,
    bookingWindowWeeks: 4,
    noticeHoursForVoucher: 72,
    voucherValidityMonths: 3,
    schedule: {
      kind: 'MANUAL' as const,
      startsAt: date,
      endsAt: new Date(date.getTime() + 7200000),
      capacity: 8,
    },
  };
}
async function setCatalogBranding(organizationId: string, photo: boolean) {
  const key = `org_${organizationId}/branding/${crypto.randomUUID()}.png`;
  if (photo) {
    const svg =
      '<svg width="600" height="900" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#241544"/><stop offset="1" stop-color="#521d39"/></linearGradient></defs><rect width="600" height="900" fill="url(#bg)"/><circle cx="460" cy="470" r="280" fill="#cf3867"/><circle cx="460" cy="470" r="170" fill="#25162f"/><path d="M0 760 Q280 560 600 810 V900 H0" fill="#582da1"/></svg>';
    const bytes = await sharp(Buffer.from(svg)).png().toBuffer();
    await browserDatabase().query(
      'INSERT INTO private_files(storage_key,organization_id,bytes) VALUES($1,$2,$3)',
      [key, organizationId, bytes],
    );
  }
  await browserDatabase().query(
    'INSERT INTO organization_branding(organization_id,background_storage_key,story_text_tone,story_layout) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT(organization_id) DO UPDATE SET background_storage_key=excluded.background_storage_key,story_text_tone=excluded.story_text_tone,story_layout=excluded.story_layout',
    [organizationId, photo ? key : null, 'WHITE', JSON.stringify(catalogPlacement)],
  );
}
