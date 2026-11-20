import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';
import { browserDatabase, closeBrowserDatabase, login } from './portal-fixtures';
import { administrationFinance, recipient } from './administration-fixtures';
import {
  saveIssuerThroughForm,
  fillRecipient,
  expectDocument,
  verifyCreditProtection,
  assertRepeatedIssue,
  verifyDocumentExport,
  captureDocumentWidths,
  saveIssuerThroughApi,
} from './administration-billing-helpers';
test.afterAll(closeBrowserDatabase);
test('configures the issuer, emits a commission invoice and downloads the same prepared PDF', async ({
  page,
}, info) => {
  const space = await administrationFinance();
  await login(page, space);
  await saveIssuerThroughForm(page);
  await page.goto(
    `/plateforme/finances?view=documents&source=${space.commission}&search=${space.slug}`,
  );
  await expect(
    page.getByRole('heading', { name: 'Commission à facturer', exact: true }),
  ).toBeVisible();
  await fillRecipient(page);
  await page.getByRole('checkbox', { name: /J’ai vérifié/ }).check();
  await page.getByRole('button', { name: 'Émettre la facture', exact: true }).click();
  const document = await expectDocument(space.commission, 'INVOICE');
  expect([document.gross_cents, document.net_cents, document.tax_cents]).toEqual([150, 124, 26]);
  await expect(page.getByRole('button', { name: 'Émettre la facture', exact: true })).toHaveCount(
    0,
  );
  const first = await page.request.get(`/api/plateforme/documents?id=${document.id}`);
  const second = await page.request.get(`/api/plateforme/documents?id=${document.id}`);
  expect(first.ok()).toBe(true);
  await verifyDocumentExport(
    page,
    document.id,
    document.document_number,
    space.slug,
    await first.body(),
  );
  expect(await first.body()).toEqual(await second.body());
  const pdf = await PDFDocument.load(await first.body());
  expect(pdf.getTitle()).toBe(document.document_number);
  const download = page.getByRole('link', { name: 'Enregistrer le PDF', exact: true }).first();
  const waiting = page.waitForEvent('download');
  await download.click();
  await (await waiting).saveAs(info.outputPath('commission-invoice.pdf'));
  await captureDocumentWidths(page, info);
});
test('serializes repeated issuance, links a credit to its invoice and refuses changes or excess credits', async ({
  page,
}) => {
  const space = await administrationFinance();
  await login(page, space);
  await saveIssuerThroughApi(page);
  const input = {
    kind: 'INVOICE',
    sourceId: space.commission,
    recipient,
    taxRateBps: 2100,
    taxNote: '',
    confirmed: true,
  };
  const before = await browserDatabase().query(
    'SELECT count(*)::int AS count FROM financial_entries WHERE organization_id=$1',
    [space.organizationId],
  );
  await assertRepeatedIssue(page, input);
  const original = await expectDocument(space.commission, 'INVOICE');
  const credit = await page.request.post('/api/plateforme/billing', {
    headers: { Origin: new URL(page.url()).origin },
    data: { action: 'issue', input: { kind: 'CREDIT', sourceId: space.credit, confirmed: true } },
  });
  expect(credit.ok()).toBe(true);
  const note = await expectDocument(space.credit, 'CREDIT');
  expect(note.original_document_id).toBe(original.id);
  expect(note.gross_cents).toBe(40);
  await expect(
    browserDatabase().query('UPDATE platform_documents SET gross_cents=999 WHERE id=$1', [
      original.id,
    ]),
  ).rejects.toThrow('immutable');
  await verifyCreditProtection(page, space, original.id, input, before.rows[0].count);
});
