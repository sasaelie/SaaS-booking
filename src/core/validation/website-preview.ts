import { z } from 'zod';
import { WEBSITE_PREVIEW } from '../../config/website-preview';
export const WebsitePreviewSlugSchema = z.literal(WEBSITE_PREVIEW.SLUG);
