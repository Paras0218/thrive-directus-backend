// Idempotent setup for the RESULTS image-card dropdown (result_cards + seed).
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
const str = (field, width = 'full', note) => ({ field, type: 'string', meta: { interface: 'input', width, ...(note ? { note } : {}) }, schema: {} });

async function main() {
  await ensureCollection({
    collection: 'result_cards',
    meta: { icon: 'view_carousel', note: 'Image cards for the RESULTS dropdown', sort_field: 'sort' },
    schema: {},
    fields: [PK],
  });
  await ensureField('result_cards', {
    field: 'status', type: 'string',
    schema: { default_value: 'draft' },
    meta: { interface: 'select-dropdown', width: 'half', display: 'labels', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }] } },
  });
  await ensureField('result_cards', { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} });
  await ensureField('result_cards', str('menu', 'half', 'Top nav label, e.g. RESULTS'));
  await ensureField('result_cards', str('title', 'half', 'Card title, e.g. Case Studies'));
  await ensureField('result_cards', str('subtitle', 'half', 'Optional stat/line, e.g. +360% Organic Traffic'));
  await ensureField('result_cards', str('image_url', 'full', 'Card background image URL'));
  await ensureField('result_cards', str('url', 'half'));

  const existing = await api('GET', '/items/result_cards?filter[menu][_eq]=RESULTS&fields=id&limit=-1');
  const existingIds = existing.ok && Array.isArray(existing.json.data) ? existing.json.data.map((r) => r.id) : [];
  if (existingIds.length) {
    const del = await api('DELETE', '/items/result_cards', existingIds);
    if (!del.ok) throw new Error('delete existing: ' + JSON.stringify(del.json));
    console.log(`cleared ${existingIds.length} existing RESULTS cards`);
  }

  const cards = [
    { title: 'Case Studies', subtitle: '+360% Organic Traffic', image: 'https://picsum.photos/seed/thrive-casestudies/440/240' },
    { title: 'Client Testimonials', subtitle: '', image: 'https://picsum.photos/seed/thrive-testimonials/440/240' },
    { title: 'Design Portfolio', subtitle: '', image: 'https://picsum.photos/seed/thrive-portfolio/440/240' },
    { title: 'Logo Design', subtitle: '', image: 'https://picsum.photos/seed/thrive-logodesign/440/240' },
    { title: 'Video Production', subtitle: '', image: 'https://picsum.photos/seed/thrive-videoproduction/440/240' },
  ];
  let sort = 1;
  for (const c of cards) {
    const r = await api('POST', '/items/result_cards', {
      status: 'published', sort: sort++, menu: 'RESULTS',
      title: c.title, subtitle: c.subtitle, image_url: c.image, url: '#',
    });
    if (!r.ok) throw new Error('seed card: ' + JSON.stringify(r.json));
  }
  console.log(`seeded ${cards.length} RESULTS cards`);
  console.log('RESULTS_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
