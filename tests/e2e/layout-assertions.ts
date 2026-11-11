import { expect, type Locator } from '@playwright/test';
export async function alignedFields(container: Locator) {
  const fields = await container.locator('.portal-field').evaluateAll((elements) =>
    elements
      .map((element) => {
        const input = element.querySelector('input,select');
        const label = element.querySelector('label');
        if (!input || !label) return null;
        const rect = input.getBoundingClientRect(),
          row = element.getBoundingClientRect();
        return {
          x: rect.x,
          width: rect.width,
          height: rect.height,
          fieldX: row.x,
          fieldWidth: row.width,
          labelX: label.getBoundingClientRect().x,
          radius: parseFloat(getComputedStyle(input).borderRadius),
        };
      })
      .filter((field) => field && field.height > 0),
  );
  expect(fields.length).toBeGreaterThan(0);
  for (const field of fields) {
    if (!field) continue;
    expect(field.height).toBeGreaterThanOrEqual(48);
    expect(Math.abs(field.x - field.fieldX)).toBeLessThan(1);
    expect(Math.abs(field.x - field.labelX)).toBeLessThan(1);
    expect(Math.abs(field.width - field.fieldWidth)).toBeLessThan(1);
    expect(field.radius).toBeGreaterThanOrEqual(12);
  }
}
export async function separatedPanels(container: Locator) {
  const panels = await container
    .locator('.portal-panel:not(.portal-metric)')
    .evaluateAll((elements) =>
      elements
        .filter((el) => el.getClientRects().length && !el.parentElement?.closest('.portal-panel'))
        .map((el) => {
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, bottom: r.bottom };
        }),
    );
  expect(panels.length).toBeGreaterThan(1);
  for (const [index, panel] of panels.entries()) {
    expect(Math.abs(panel.x - (panels[0]?.x ?? panel.x))).toBeLessThan(1);
    const previous = panels[index - 1];
    if (previous) expect(panel.y - previous.bottom).toBeGreaterThanOrEqual(12);
  }
}
