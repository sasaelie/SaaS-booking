import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

async function migration(name: string) {
  const content = await readFile(`migrations/${name}`, 'utf8');
  const hash = createHash('sha256').update(content).digest('hex');
  return {
    name: `booking_${name.replace(/\.sql$/, '').replace(/-/g, '_')}`,
    query:
      `SET LOCAL search_path = booking, public;\n${content}\n` +
      `INSERT INTO booking.schema_migrations(name, hash) VALUES ('${name}', '${hash}');`,
  };
}

async function main(): Promise<void> {
  const files = (await readdir('migrations'))
    .filter((name) => /^\d+[-_][\w-]+\.sql$/.test(name))
    .sort();
  const bundle = [
    {
      name: 'booking_private_bootstrap',
      query: await readFile('deploy/supabase-bootstrap.sql', 'utf8'),
    },
    ...(await Promise.all(files.map(migration))),
    { name: 'booking_private_harden', query: await readFile('deploy/supabase-harden.sql', 'utf8') },
  ];
  process.stdout.write(JSON.stringify(bundle));
}

await main();
