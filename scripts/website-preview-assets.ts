import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
const media: Record<string, string> = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};
export async function websitePreviewAsset(sourceRoot: string, value: string, base: string) {
  if (value.startsWith('data:')) return value;
  const url = new URL(value, base);
  const pathname =
    url.pathname === '/_next/image'
      ? new URL(url.searchParams.get('url') ?? '', base).pathname
      : url.pathname;
  const relative = pathname.startsWith('/_next/static/')
    ? '.next/static/' + pathname.slice('/_next/static/'.length)
    : 'public/' + pathname.replace(/^\//, '');
  const file = resolve(join(sourceRoot, relative));
  if (!file.startsWith(resolve(sourceRoot) + '/')) throw Error('Asset outside selected website');
  const mime = media[extname(file)];
  if (!mime) throw Error('Unsupported website asset');
  return `data:${mime};base64,${(await readFile(file)).toString('base64')}`;
}
export async function websitePreviewCss(sourceRoot: string, css: string, base: string) {
  const matches = [...css.matchAll(/url\((?:["']?)([^)'"\s]+)(?:["']?)\)/g)];
  for (const match of matches) {
    const value = match[1];
    if (!value || value.startsWith('data:')) continue;
    css = css.replaceAll(match[0], `url("${await websitePreviewAsset(sourceRoot, value, base)}")`);
  }
  return css;
}
