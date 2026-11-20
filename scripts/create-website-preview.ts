import { chromium, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { WEBSITE_PREVIEW as W, websitePreviewPath } from '../src/config/website-preview';
import { websitePreviewBootstrap } from '../src/adapters/preview/website-preview-bootstrap';
import { websitePreviewAsset, websitePreviewCss } from './website-preview-assets';
async function captureStyles(page: Page, sourceRoot: string) {
  const links = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((nodes) => nodes.map((n) => (n as HTMLLinkElement).href));
  const styles: string[] = [];
  for (const link of links) {
    const response = await page.request.get(link);
    if (!response.ok()) throw Error('Website stylesheet unavailable');
    styles.push(await websitePreviewCss(sourceRoot, await response.text(), link));
  }
  return styles.join('\n');
}
async function prepareDocument(page: Page, styles: string, sourceRoot: string) {
  await page
    .locator('script,link[rel="preload"],link[rel="prefetch"],link[rel="stylesheet"]')
    .evaluateAll((nodes) => nodes.forEach((n) => n.remove()));
  await page.locator('main h1').evaluate((e, text) => {
    e.textContent = text;
  }, W.BOOKING_TITLE);
  await page.locator('main header > p').evaluate((e, text) => {
    e.textContent = text;
  }, W.BOOKING_DESCRIPTION);
  await page.locator('form').evaluate(insertFrame, {
    note: W.NOTE,
    hint: W.HINT,
    title: W.FRAME_TITLE,
    path: websitePreviewPath(W.SLUG),
  });
  await rewriteLinks(page);
  await rewriteMetadata(page, sourceRoot);
  await rewriteImages(page, sourceRoot);
  await page.locator('head').evaluate((head, css) => {
    const style = document.createElement('style');
    style.textContent = css;
    head.append(style);
  }, styles + previewStyles());
}
async function rewriteImages(page: Page, sourceRoot: string) {
  const images = await page.locator('img').all();
  for (const image of images) {
    const value = await websitePreviewAsset(
      sourceRoot,
      (await image.getAttribute('src')) ?? '',
      page.url(),
    );
    await image.evaluate((node, src) => {
      node.setAttribute('src', src);
      node.removeAttribute('srcset');
    }, value);
  }
}
async function rewriteLinks(page: Page) {
  await page.locator('a[href]').evaluateAll((nodes, base) => {
    for (const node of nodes) {
      const link = node as HTMLAnchorElement,
        href = link.getAttribute('href') ?? '';
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
      const url = new URL(href, base);
      if (url.pathname === '/reservation') {
        link.href = '#private-preview-note';
        continue;
      }
      link.href = url.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  }, W.SOURCE_URL);
}
function previewStyles() {
  return '\n#private-preview-content{background:transparent;border:0;box-shadow:none;backdrop-filter:none;padding:0}#private-preview-note{padding-block:0 24px;margin-bottom:24px;border-bottom:1px solid rgb(var(--studio-shadow-rgb)/.2)}#private-preview-note strong{font-size:14px}#private-preview-note p{font-size:14px;margin-top:8px}#studio-booking-preview{display:block;width:100%;height:1100px;border:0;border-radius:16px;overflow:hidden}';
}
async function main() {
  const sourceRoot = resolve(process.argv[2] ?? '/workspace/studio-creatif-360-site');
  if (
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: sourceRoot, encoding: 'utf8' }).trim() !==
    W.SOURCE_REVISION
  )
    throw Error('Website revision changed');
  const browser = await chromium.launch({
    executablePath: process.env['BROWSER_EXECUTABLE_PATH'] ?? '/usr/bin/chromium',
  });
  try {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:3120/reservation', { waitUntil: 'networkidle' });
    const styles = await captureStyles(page, sourceRoot);
    await prepareDocument(page, styles, sourceRoot);
    await page.locator('title').evaluate((e, title) => {
      e.textContent = title;
    }, W.TITLE);
    const html = (await page.content()).replace(
      '</body>',
      `<script nonce="${W.NONCE_MARKER}">${websitePreviewBootstrap()}</script></body>`,
    );
    await writeFile(join(process.cwd(), W.TEMPLATE_FILE), html);
    console.info('Private website snapshot prepared from the selected source checkout');
  } finally {
    await browser.close();
  }
}
void main().catch(() => {
  console.error('Private website snapshot preparation failed');
  process.exitCode = 1;
});

function insertFrame(
  form: HTMLElement | SVGElement,
  value: { note: string; hint: string; title: string; path: string },
) {
  const parent = form.parentElement;
  if (!parent) throw Error('Reservation container missing');
  parent.replaceChildren();
  parent.id = 'private-preview-content';
  const note = document.createElement('aside');
  note.setAttribute('role', 'note');
  note.id = 'private-preview-note';
  const title = document.createElement('strong');
  title.textContent = value.note;
  const text = document.createElement('p');
  text.textContent = value.hint;
  note.append(title, text);
  const frame = document.createElement('iframe');
  frame.id = 'studio-booking-preview';
  frame.title = value.title;
  frame.src = value.path;
  frame.setAttribute(
    'sandbox',
    'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-top-navigation-by-user-activation',
  );
  parent.append(note, frame);
}

async function rewriteMetadata(page: Page, sourceRoot: string) {
  const icon = page.locator('link[rel="icon"]').first();
  const value = await websitePreviewAsset(
    sourceRoot,
    (await icon.getAttribute('href')) ?? '',
    page.url(),
  );
  await icon.evaluate((node, href) => node.setAttribute('href', href), value);
  await page
    .locator('link[rel="canonical"]')
    .evaluateAll((nodes) => nodes.forEach((n) => n.remove()));
  await page
    .locator('meta[name="description"]')
    .evaluateAll((nodes, text) => nodes.forEach((n) => n.setAttribute('content', text)), W.HINT);
  await page.locator('head').evaluate((head) => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    head.append(meta);
  });
}
