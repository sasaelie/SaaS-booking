import { z } from 'zod';
import { PRIVATE_FILES } from '../../config/private-files';
import { INPUT_LIMITS } from '../../config/constants';

export const PrivateFileKeySchema = z
  .string()
  .min(1)
  .max(PRIVATE_FILES.KEY_MAX)
  .regex(/^(?:org_)?[a-f0-9-]+\/(?:branding|[a-f0-9-]+)\/[a-f0-9-]+\.png$/)
  .refine((key) => z.uuid().safeParse(key.split('/')[0]?.replace(/^org_/, '')).success);
export const PrivateFileTokenSchema = z.string().min(1).max(INPUT_LIMITS.TOKEN_MAX);
