// Idempotent setup for the CMS-editable site header (singleton + nav items + seed).
import fs from 'node:fs';

const BASE = 'http://localhost:8055';
const TOKEN = fs.readFileSync('E:/directus-cms/static-token.txt', 'utf8').trim();

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

async function main() {
  // --- header (singleton) ---
  await ensureCollection({
    collection: 'header',
    meta: { icon: 'view_headline', singleton: true, note: 'Site header: logo text + phone' },
    schema: {},
    fields: [PK],
  });
  await ensureField('header', str('logo_text', 'half'));
  await ensureField('header', str('logo_url'));
  await ensureField('header', str('phone', 'half'));

  // --- nav_items (repeatable) ---
  await ensureCollection({
    collection: 'nav_items',
    meta: { icon: 'menu', note: 'Header navigation menu items', sort_field: 'sort' },
    schema: {},
    fields: [PK],
  });
  await ensureField('nav_items', {
    field: 'status', type: 'string',
    schema: { default_value: 'draft' },
    meta: {
      interface: 'select-dropdown', width: 'half', display: 'labels',
      options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }] },
    },
  });
  await ensureField('nav_items', { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} });
  await ensureField('nav_items', str('label', 'half'));
  await ensureField('nav_items', str('url', 'half'));
  await ensureField('nav_items', {
    field: 'has_dropdown', type: 'boolean',
    schema: { default_value: false },
    meta: { interface: 'boolean', width: 'half', note: 'Show a dropdown caret (▼)' },
  });

  // --- seed header ---
  const header = { logo_text: 'thrive', logo_url: '/thrive-logo.svg', phone: '843-353-6383' };
  let seed = await api('PATCH', '/items/header', header);
  if (!seed.ok) seed = await api('POST', '/items/header', header);
  if (!seed.ok) throw new Error('seed header: ' + JSON.stringify(seed.json));
  console.log('header content seeded');

  // --- seed nav items (only if empty) ---
  const existing = await api('GET', '/items/nav_items?limit=1');
  const count = existing.ok && Array.isArray(existing.json.data) ? existing.json.data.length : 0;
  if (count === 0) {
    const items = [
      { status: 'published', sort: 1, label: 'SERVICES', url: '#', has_dropdown: true },
      { status: 'published', sort: 2, label: 'LOCAL', url: '#', has_dropdown: true },
      { status: 'published', sort: 3, label: 'RESULTS', url: '#', has_dropdown: true },
      { status: 'published', sort: 4, label: 'ABOUT', url: '/about', has_dropdown: true },
      { status: 'published', sort: 5, label: 'LEARN', url: '#', has_dropdown: true },
      { status: 'published', sort: 6, label: 'CONTACT', url: '/', has_dropdown: false },
    ];
    for (const it of items) {
      const r = await api('POST', '/items/nav_items', it);
      if (!r.ok) throw new Error('seed nav item: ' + JSON.stringify(r.json));
    }
    console.log(`seeded ${items.length} nav items`);
  } else {
    console.log('nav items already present, skip seed');
  }

  console.log('HEADER_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
