// Idempotent setup for the CMS-editable Search results page (singleton + fields + seed).
// Mirrors setup-about.mjs. Run with Directus up:  node setup-search.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'http://localhost:8055';
// Read the token next to this script (robust regardless of where the project lives).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = fs.readFileSync(path.join(__dirname, 'static-token.txt'), 'utf8').trim();

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { ok: res.ok, status: res.status, json };
}

async function ensureCollection(def) {
  const exists = await api('GET', `/collections/${def.collection}`);
  if (exists.ok) { console.log(`= collection ${def.collection} (exists)`); return; }
  const r = await api('POST', '/collections', def);
  if (!r.ok) throw new Error(`create collection ${def.collection}: ` + JSON.stringify(r.json));
  console.log(`+ collection ${def.collection}`);
}

async function ensureField(collection, def) {
  const exists = await api('GET', `/fields/${collection}/${def.field}`);
  if (exists.ok) { console.log(`  = ${collection}.${def.field} (exists)`); return; }
  const r = await api('POST', `/fields/${collection}`, def);
  if (!r.ok) throw new Error(`create field ${collection}.${def.field}: ` + JSON.stringify(r.json));
  console.log(`  + ${collection}.${def.field}`);
}

const PK = {
  field: 'id', type: 'integer',
  meta: { hidden: true, interface: 'input', readonly: true },
  schema: { is_primary_key: true, has_auto_increment: true },
};
const str = (field, width = 'full') => ({ field, type: 'string', meta: { interface: 'input', width }, schema: {} });
const txt = (field) => ({ field, type: 'text', meta: { interface: 'input-multiline', width: 'full' }, schema: {} });

async function main() {
  await ensureCollection({
    collection: 'search_page',
    meta: { icon: 'search', singleton: true, note: 'Editable Search results page labels' },
    schema: {},
    fields: [PK],
  });

  const fields = [
    str('seo_title'),
    str('results_heading'),
    txt('no_results_text'),
    txt('empty_prompt'),
    str('input_placeholder'),
  ];
  for (const f of fields) await ensureField('search_page', f);

  const content = {
    seo_title: 'Search',
    results_heading: 'Search Results For:',
    no_results_text: 'Sorry, no posts were found.',
    empty_prompt: 'Enter a term above to search the site.',
    input_placeholder: 'Search this website',
  };
  let seed = await api('PATCH', '/items/search_page', content);
  if (!seed.ok) seed = await api('POST', '/items/search_page', content);
  if (!seed.ok) throw new Error('seed search_page: ' + JSON.stringify(seed.json));
  console.log('search_page content seeded');
  console.log('SEARCH_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
