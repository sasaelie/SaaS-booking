import { z } from 'zod';
import { STORY_LAYOUT } from '../../config/story-layout';
const point = z
  .object({
    x: z.number().int().min(STORY_LAYOUT.MIN).max(STORY_LAYOUT.MAX),
    y: z.number().int().min(STORY_LAYOUT.MIN).max(STORY_LAYOUT.MAX),
  })
  .strict();
export const StoryLayoutSchema = z.object({ title: point, price: point }).strict();
export type StoryLayout = z.infer<typeof StoryLayoutSchema>;
