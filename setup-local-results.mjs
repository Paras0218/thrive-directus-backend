// Seed the 2 LOCAL "Results" sidebar cards (Case Studies + Client Testimonials).
// Reuses the result_cards collection, keyed by menu=LOCAL. Faithful to the live site.
import fs from 'node:fs';

const BASE = 'http://localhost:8055';
const TOKEN = fs.readFileSync('E:/directus-cms/static-token.txt', 'utf8').trim();
const IMG = '/assets/menu/local';

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

async function ensureField(collection, def) {
  const exists = await api('GET', `/fields/${collection}/${def.field}`);
  if (exists.ok) { console.log(`  = ${collection}.${def.field} (exists)`); return; }
  const r = await api('POST', `/fields/${collection}`, def);
  if (!r.ok) throw new Error(`create field ${collection}.${def.field}: ` + JSON.stringify(r.json));
  console.log(`  + ${collection}.${def.field}`);
}

async function main() {
  // result_cards collection already exists (created by setup-results.mjs). Ensure fields just in case.
  await ensureField('result_cards', { field: 'menu', type: 'string', meta: { interface: 'input', width: 'half', note: 'Top nav label, e.g. RESULTS or LOCAL' }, schema: {} });
  await ensureField('result_cards', { field: 'image_url', type: 'string', meta: { interface: 'input', width: 'full', note: 'Card image URL' }, schema: {} });

  // reset existing LOCAL cards
  const existing = await api('GET', '/items/result_cards?filter[menu][_eq]=LOCAL&fields=id&limit=-1');
  const existingIds = existing.ok && Array.isArray(existing.json.data) ? existing.json.data.map((r) => r.id) : [];
  if (existingIds.length) {
    const del = await api('DELETE', '/items/result_cards', existingIds);
    if (!del.ok) throw new Error('delete existing LOCAL cards: ' + JSON.stringify(del.json));
    console.log(`cleared ${existingIds.length} existing LOCAL cards`);
  }

  const cards = [
    { title: 'Thrive Local Case Studies', image: `${IMG}/thrive-local-case-image.jpg`, url: '/thrive-local/thrive-local-case-studies/' },
    { title: 'Thrive Local Client Testimonials', image: `${IMG}/thrive-local-testimonials-client.jpg`, url: '/thrive-local/client-testimonials/' },
  ];
  let sort = 1;
  for (const c of cards) {
    const r = await api('POST', '/items/result_cards', {
      status: 'published', sort: sort++, menu: 'LOCAL',
      title: c.title, subtitle: '', image_url: c.image, url: c.url,
    });
    if (!r.ok) throw new Error('seed LOCAL card: ' + JSON.stringify(r.json));
  }
  console.log(`seeded ${cards.length} LOCAL result cards`);
  console.log('LOCAL_RESULTS_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
