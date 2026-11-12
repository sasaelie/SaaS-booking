import { z } from 'zod';
export const PlanIntentSchema = z.enum(['liberte', 'pro']);
export type PlanIntent = z.infer<typeof PlanIntentSchema>;
