import { expect, type Page, type TestInfo } from '@playwright/test';
import { browserDatabase, noHorizontalOverflow } from './portal-fixtures';
import { administrationFinance, issuer, recipient } from './administration-fixtures';
export async function saveIssuerThroughForm(page: Page) {
  await page.goto('/plateforme/finances?view=parametres');
  await page.getByLabel('Raison sociale', { exact: true }).fill(issuer.legalName);
  await page.getByLabel('Adresse de facturation', { exact: true }).fill(issuer.address);
  await page.getByLabel('Code pays (2 lettres)', { exact: true }).fill(issuer.country);
  await page.getByLabel('Numéro d’entreprise', { exact: true }).fill(issuer.registrationNumber);
  await page.getByLabel('Numéro de TVA', { exact: true }).fill(issuer.vatNumber);
  await page.getByLabel('E-mail de facturation', { exact: true }).fill(issuer.email);
  await page.getByLabel('Taux de TVA (%)', { exact: true }).fill('21');
  await page.getByLabel('Préfixe des factures', { exact: true }).fill(issuer.prefix);
  await page.getByRole('button', { name: 'Enregistrer la facturation', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Enregistré.');
}
export async function fillRecipient(page: Page) {
  await page.getByLabel('Raison sociale', { exact: true }).fill(recipient.legalName);
  await page.getByLabel('Adresse de facturation', { exact: true }).fill(recipient.address);
  await page.getByLabel('Code pays (2 lettres)', { exact: true }).fill(recipient.country);
}
export async function expectDocument(source: string | undefined, kind: string) {
  await expect
    .poll(
      async () =>
        (
          await browserDatabase().query(
            'SELECT count(*)::int AS count FROM platform_documents WHERE source_id=$1 AND kind=$2',
            [source, kind],
          )
        ).rows[0]?.count,
    )
    .toBe(1);
  const row = await browserDatabase().query(
    'SELECT * FROM platform_documents WHERE source_id=$1 AND kind=$2',
    [source, kind],
  );
  return row.rows[0];
}

export async function verifyCreditProtection(
  page: Page,
  space: Awaited<ReturnType<typeof administrationFinance>>,
  originalId: string,
  input: unknown,
  previousCount: number,
) {
  await expect(
    browserDatabase().query('DELETE FROM platform_documents WHERE id=$1', [originalId]),
  ).rejects.toThrow('immutable');
  const extra = await browserDatabase().query(
    "INSERT INTO financial_entries(organization_id,booking_id,source_key,kind,amount_cents) VALUES($1,$2,$3,'ADJUSTMENT',200) RETURNING id",
    [space.organizationId, space.bookingId, `commission-refund:${crypto.randomUUID()}`],
  );
  expect(
    (
      await page.request.post('/api/plateforme/billing', {
        headers: { Origin: new URL(page.url()).origin },
        data: {
          action: 'issue',
          input: { kind: 'CREDIT', sourceId: extra.rows[0].id, confirmed: true },
        },
      })
    ).ok(),
  ).toBe(false);
  const after = await browserDatabase().query(
    'SELECT count(*)::int AS count FROM financial_entries WHERE organization_id=$1',
    [space.organizationId],
  );
  expect(after.rows[0].count).toBe(previousCount + 1);
  await verifyRevokedOperator(page, originalId, input);
}

export async function assertRepeatedIssue(page: Page, input: unknown) {
  const repeated = await Promise.all(
    [1, 2].map(() =>
      page.request.post('/api/plateforme/billing', {
        headers: { Origin: new URL(page.url()).origin },
        data: { action: 'issue', input },
      }),
    ),
  );
  for (const response of repeated) expect(response.ok()).toBe(true);
  const first = await repeated[0]?.json(),
    second = await repeated[1]?.json();
  expect(first.data.id).toBe(second.data.id);
}
export async function verifyDocumentExport(
  page: Page,
  id: string,
  number: string,
  slug: string,
  bytes: Uint8Array,
) {
  const csv = await page.request.get(`/api/plateforme/export?search=${slug}`);
  expect(await csv.text()).toContain(number);
  const changed = await page.request.post('/api/plateforme/billing', {
    headers: { Origin: new URL(page.url()).origin },
    data: { action: 'settings', input: { ...issuer, legalName: 'Autre nom de test' } },
  });
  expect(changed.ok()).toBe(true);
  const same = await page.request.get(`/api/plateforme/documents?id=${id}`);
  expect(new Uint8Array(await same.body())).toEqual(new Uint8Array(bytes));
}

export async function captureDocumentWidths(page: Page, info: TestInfo) {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`documents-${width}.png`), fullPage: true });
  }
}
export async function saveIssuerThroughApi(page: Page) {
  const response = await page.request.post('/api/plateforme/billing', {
    headers: { Origin: new URL(page.url()).origin },
    data: { action: 'settings', input: issuer },
  });
  expect(response.ok()).toBe(true);
}

async function verifyRevokedOperator(page: Page, originalId: string, input: unknown) {
  await browserDatabase().query('DELETE FROM platform_operators WHERE user_id=$1', [
    (
      await browserDatabase().query('SELECT issued_by FROM platform_documents WHERE id=$1', [
        originalId,
      ])
    ).rows[0].issued_by,
  ]);
  expect((await page.request.get(`/api/plateforme/documents?id=${originalId}`)).ok()).toBe(false);
  expect(
    (
      await page.request.post('/api/plateforme/billing', {
        headers: { Origin: new URL(page.url()).origin },
        data: { action: 'issue', input },
      })
    ).ok(),
  ).toBe(false);
}
