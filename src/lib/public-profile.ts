import { z } from 'zod';
import { PublicIdentitySchema } from '../config/public-site';
type PublicEnvironment = Readonly<Record<string, string | undefined>>;
function field(schema: z.ZodType<string | undefined>, value: unknown) {
  const parsed = schema.safeParse(value);
  return parsed.success ? (parsed.data ?? null) : null;
}
export function publicProfile(input: PublicEnvironment = process.env) {
  const fields = PublicIdentitySchema.shape;
  return {
    name: field(fields.PUBLIC_LEGAL_NAME, input['PUBLIC_LEGAL_NAME']),
    address: field(fields.PUBLIC_LEGAL_ADDRESS, input['PUBLIC_LEGAL_ADDRESS']),
    businessNumber: field(fields.PUBLIC_BUSINESS_NUMBER, input['PUBLIC_BUSINESS_NUMBER']),
    taxStatus: field(fields.PUBLIC_TAX_STATUS, input['PUBLIC_TAX_STATUS']),
    vatNumber: field(fields.PUBLIC_VAT_NUMBER, input['PUBLIC_VAT_NUMBER']),
    email: field(fields.PUBLIC_CONTACT_EMAIL, input['PUBLIC_CONTACT_EMAIL']),
    phone: field(fields.PUBLIC_CONTACT_PHONE, input['PUBLIC_CONTACT_PHONE']),
  };
}
