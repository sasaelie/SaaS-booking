import { expect, it } from 'vitest';
import { EMBED_HEALTH as H } from '../../src/config/embed-health';
import { EmbedReadySchema, EmbedCheckUrlSchema } from '../../src/core/validation/embed-health';
import { embedReady } from '../../src/lib/embed-health';
import { embedCheckUrl, embedInstallCode } from '../../src/lib/embed-install-code';
import { Script } from 'node:vm';
import { widgetSource } from '../../src/adapters/share/widget-source';
it('generates executable standalone JavaScript without depending on host storage', () => {
  const source = widgetSource();
  expect(() => new Script(source)).not.toThrow();
  expect(source).not.toMatch(/sessionStorage|localStorage|document\.cookie/);
});
it('accepts only the expected frame and origin and the public readiness contract', () => {
  const source = {};
  const data = { type: H.READY, version: H.VERSION, status: 'ready' };
  const event = { data, source, origin: 'https://booking.example' };
  expect(embedReady(event, source, 'https://booking.example')).toBe('ready');
  expect(embedReady(event, {}, 'https://booking.example')).toBeNull();
  expect(embedReady({ ...event, source: null }, null, event.origin)).toBeNull();
  expect(embedReady(event, source, 'https://other.example')).toBeNull();
  expect(embedReady({ ...event, data: { ...data, version: -1 } }, source, event.origin)).toBeNull();
  expect(EmbedReadySchema.safeParse({ ...data, token: 'private-value' }).success).toBe(false);
});
it('includes an independent public access before the script and preserves host URL state', () => {
  const code = embedInstallCode('https://booking.example', 'atelier', 'inline');
  expect(code.indexOf('<a ')).toBeLessThan(code.indexOf('<script '));
  expect(code).toContain('href="https://booking.example/atelier"');
  expect(code).toContain('rel="noopener noreferrer"');
  expect(code).not.toMatch(/token|bypass|secret/i);
  const url = new URL(
    embedCheckUrl('https://site.example/cours?lang=fr#programme', 'atelier') ?? '',
  );
  expect(url.searchParams.get('lang')).toBe('fr');
  expect(url.searchParams.get(H.DIAGNOSTIC_PARAM)).toBe('atelier');
  expect(url.hash).toBe('#programme');
  expect(embedCheckUrl('javascript:alert(1)', 'atelier')).toBeNull();
});
it('rejects unsafe addresses without making any network request', () => {
  for (const value of [
    '',
    'not-a-url',
    'https://',
    'javascript:alert(1)',
    'http://site.example',
    'https://user:pass@site.example',
  ])
    expect(EmbedCheckUrlSchema.safeParse(value).success).toBe(false);
  expect(embedCheckUrl('not-a-url', 'atelier')).toBeNull();
  expect(EmbedCheckUrlSchema.safeParse('https://site.example/ateliers?lang=fr').success).toBe(true);
});
