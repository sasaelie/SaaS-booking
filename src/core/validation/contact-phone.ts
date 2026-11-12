import { z } from 'zod';
import { CONTACT } from '../../config/contact';
import { normalizeContactPhone, isValidContactPhone } from '../domain/contact-phone';
export const ContactPhoneSchema = z
  .string()
  .trim()
  .max(CONTACT.INPUT_MAX)
  .transform(normalizeContactPhone)
  .refine((value) => !value || isValidContactPhone(value), CONTACT.INVALID);
