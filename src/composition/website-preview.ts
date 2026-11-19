import 'server-only';
import { runtime } from './runtime';
import { portal } from './portal';
import { publicCatalog } from './public-catalog';
import { simulation } from './simulation';
import { WebsitePreviewAccessUseCase } from '../core/use-cases/portal/website-preview.use-case';
import { WebsitePreviewDocumentAdapter } from '../adapters/preview/website-preview-document.adapter';
import { WEBSITE_PREVIEW as W } from '../config/website-preview';
export async function websitePreview(headers: Headers, slug: unknown, refresh = false) {
  const app = runtime(),
    studio = portal(headers),
    catalog = publicCatalog();
  if (!app.ok) return app;
  if (!studio.ok) return studio;
  if (!catalog.ok) return catalog;
  const access = await new WebsitePreviewAccessUseCase(
    {
      security: studio.value.security,
      catalog: catalog.value,
      organizations: studio.value.organizations,
    },
    app.value.env.APP_ENVIRONMENT === W.MODE,
  ).execute(slug);
  return access.ok ? simulation(headers, access.value.organizationId, refresh) : access;
}
export function websitePreviewDocument(nonce: string | null) {
  return new WebsitePreviewDocumentAdapter().render(nonce);
}
