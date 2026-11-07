import { sql } from 'drizzle-orm';
import { rows, required, type Transaction } from '../transaction';
import { generateStructuredCommunication } from '../../../lib/modulo97';
export async function bankReference(tx: Transaction): Promise<string> {
  const [row] = await rows<{ value: string }>(
    tx,
    sql`SELECT nextval('bank_reference_sequence')::text AS value`,
  );
  if (!row) throw Error('Bank reference unavailable');
  return required(generateStructuredCommunication(Number(row.value)));
}
