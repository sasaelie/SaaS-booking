import type { SOCIAL_NETWORKS } from '../../config/service';
export type SocialLinks = Partial<Record<keyof typeof SOCIAL_NETWORKS, string>>;
export interface EventDetails {
  readonly address?: string;
  readonly addressVisibility?: 'PUBLIC' | 'REMINDER';
  readonly practicalInfo?: string;
  readonly participationTerms?: string;
}
