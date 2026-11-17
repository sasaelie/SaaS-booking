import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  browserSpace,
  browserDatabase,
  closeBrowserDatabase,
  login,
  noHorizontalOverflow,
} from './portal-fixtures';
test.afterAll(closeBrowserDatabase);
test('presses dashboard actions without turning the grouped counters into separate cards', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await login(page, space);
  await page.goto(`/app/${space.organizationId}`);
  const counters = page.locator('.dashboard-overview .portal-metric-link');
  await expect(counters).toHaveCount(4);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const action of [
      page.getByRole('link', { name: 'Créer une activité', exact: true }),
      ...(await counters.all()),
    ]) {
      await expectPressed(page, action);
    }
    await noHorizontalOverflow(page);
    await page.screenshot({ path: info.outputPath(`dashboard-${width}.png`), fullPage: true });
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expectPressed(page, counters.first(), true);
  await counters.first().click();
  await expect(page).toHaveURL(new RegExp(`/activites/${space.activityId}$`));
});
test('lights only the organizer course being opened, retains its color while loading and clears it on return', async ({
  page,
}, info) => {
  const space = await browserSpace();
  await addSecondSession(space);
  await page.setViewportSize({ width: 390, height: 1000 });
  await login(page, space);
  const navigation = await holdSessionNavigation(page);
  try {
    await page.goto(`/app/${space.organizationId}`);
    const courses = page.locator('.portal-session-link');
    await expect(courses).toHaveCount(2);
    const chosen = courses.last(),
      other = courses.first();
    await pressCourse(page, chosen);
    await navigation.started;
    await expect(chosen.locator('.planning-link-pending:not([hidden])')).toHaveCount(1);
    await expectLit(chosen);
    await expect(other).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await page
      .locator('.session-planning')
      .screenshot({ path: info.outputPath('organizer-course-illuminated.png') });
    navigation.release();
    await expect(page).toHaveURL(/\/seances\//);
    await expect(page.locator('.portal-session-details')).toBeVisible();
    await page.goBack();
    await expect(page.locator('.planning-link-pending:not([hidden])')).toHaveCount(0);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.keyboard.press('Tab');
    await courses.first().focus();
    await expectLit(courses.first());
    await courses.first().press('Enter');
    await expect(page).toHaveURL(/\/seances\//);
  } finally {
    navigation.release();
  }
});
async function addSecondSession(space: Awaited<ReturnType<typeof browserSpace>>) {
  const second = new Date(space.date.getTime() + 3 * 3600000);
  await browserDatabase().query(
    'INSERT INTO sessions(organization_id,activity_id,starts_at,ends_at,capacity,is_manual) VALUES($1,$2,$3,$4,8,true)',
    [space.organizationId, space.activityId, second, new Date(second.getTime() + 7200000)],
  );
}
async function pressCourse(page: Page, course: Locator) {
  await course.scrollIntoViewIfNeeded();
  const box = await course.boundingBox();
  if (!box) throw Error('Course must be visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  try {
    await expectLit(course);
  } finally {
    await page.mouse.up();
  }
}
async function expectPressed(page: Page, action: Locator, reduced = false) {
  await action.scrollIntoViewIfNeeded();
  const box = await action.boundingBox();
  if (!box) throw Error('Dashboard action must be visible');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  const initial = await action.evaluate((e) => getComputedStyle(e).boxShadow);
  await page.mouse.down();
  try {
    await expect(action).toHaveCSS('scale', reduced ? '1' : '0.95');
    await expect
      .poll(() => action.evaluate((e) => getComputedStyle(e).boxShadow))
      .not.toBe(initial);
  } finally {
    await page.mouse.move(1, 1);
    await page.mouse.up();
  }
}
async function expectLit(course: Locator) {
  const light = await course
    .locator('.planning-event-light')
    .evaluate((e) => getComputedStyle(e).backgroundColor);
  await expect(course).toHaveCSS('border-top-color', light);
  await expect(course).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
}
async function holdSessionNavigation(page: Page) {
  let release = () => {},
    began = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    began = resolve;
  });
  await page.route(
    (url) => url.pathname.includes('/seances/'),
    async (route) => {
      const headers = route.request().headers();
      if (headers['rsc'] === '1') {
        if (headers['next-router-prefetch'] === '1') return route.abort();
        began();
        await pending;
      }
      await route.continue();
    },
  );
  return { release, started };
}
