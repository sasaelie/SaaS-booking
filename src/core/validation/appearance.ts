import { STORY_TONES } from '../../config/story';
import { z } from 'zod';
import { APPEARANCE } from '../../config/appearance';
export const HueSchema = z.number().int().min(APPEARANCE.MIN).max(APPEARANCE.MAX);
export const AppearanceSchema = z
  .object({
    organizationId: z.uuid(),
    organizerHue: HueSchema.nullable(),
    storyTextTone: z.enum(STORY_TONES).optional(),
    participantHue: HueSchema.nullable(),
  })
  .strict();
export type AppearanceInput = z.infer<typeof AppearanceSchema>;
