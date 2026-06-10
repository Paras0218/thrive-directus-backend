// Exports all user-collection content from the running (MySQL) Directus to data-export.json.
// DB-agnostic: pulls via REST API using the static admin token, so the dump imports
// cleanly into the Postgres-backed instance later.
import fs from 'node:fs';

const BASE = 'http://localhost:8055';
const TOKEN = fs.readFileSync('E:/directus-cms/static-token.txt', 'utf8').trim();

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`${res.status} ${path}: ${await res.text()}`);
  return (await res.json()).data;
}

async function main() {
  const collections = await api('/collections?limit=-1');
  const userCols = collections
    .filter((c) => !c.collection.startsWith('directus_'))
    .filter((c) => c.schema)  // skip folder/grouping collections (no DB table)
    .map((c) => ({ name: c.collection, singleton: !!(c.meta && c.meta.singleton) }));

  const out = {};
  for (const c of userCols) {
    if (c.singleton) {
      const obj = await api(`/items/${c.name}`);
      out[c.name] = { singleton: true, data: obj };
      console.log(`singleton  ${c.name}: ${obj ? 'present' : 'empty'}`);
    } else {
      const rows = await api(`/items/${c.name}?limit=-1&sort=id`);
      out[c.name] = { singleton: false, data: Array.isArray(rows) ? rows : [] };
      console.log(`collection ${c.name}: ${out[c.name].data.length} rows`);
    }
  }

  fs.writeFileSync('E:/directus-cms/data-export.json', JSON.stringify(out, null, 2));
  console.log('\nEXPORT_DONE -> E:/directus-cms/data-export.json');
}

main().catch((e) => { console.error('EXPORT_ERROR:', e.message); process.exit(1); });
