import { z } from 'zod';
export const SimulationOrganizationSchema = z.uuid();
export const SimulationPaymentSchema = z.object({ bookingId: z.uuid(), success: z.boolean() });
export const SimulationDeleteSchema = z.object({ bookingId: z.uuid() });
