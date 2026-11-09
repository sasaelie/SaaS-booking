import type { StoryTextTone } from '../../config/story';
import type { Result } from '../../lib/result';
import type { AudiencePolicy } from '../../config/constants';
export interface PublicCatalog {
  readonly organizationId: string;
  readonly name: string;
  readonly slug: string;
  readonly theme: string;
  readonly participantHue?: number | null;
  readonly hasLogo: boolean;
  readonly hasBackground?: boolean;
  readonly storyTextTone?: StoryTextTone;
  readonly activities: readonly {
    readonly id: string;
    readonly name: string;
    readonly description: string | null;
    readonly priceCents: number;
    readonly currency: string;
    readonly audiencePolicy: AudiencePolicy;
  }[];
}
export interface PublicCatalogPort {
  find(slug: string): Promise<Result<PublicCatalog>>;
}
export interface QrCodePort {
  encode(url: string): Promise<Result<Uint8Array>>;
}
