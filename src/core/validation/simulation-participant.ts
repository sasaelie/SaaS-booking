import { z } from 'zod';
import { ParticipantExchangeSchema } from './participant';
import { SelfCancelTokenSchema } from './self-service';
import { PARTICIPANT } from '../../config/constants';
export const SimulationParticipantExchangeSchema = ParticipantExchangeSchema.refine(({ code }) =>
  code.startsWith(`${PARTICIPANT.TEST_PREFIX}-`),
);
export const SimulationParticipantTargetSchema = z.object({
  organizationId: z.uuid(),
  token: SelfCancelTokenSchema,
});
export type SimulationParticipantTarget = z.infer<typeof SimulationParticipantTargetSchema>;
