// Seed the ABOUT mega-menu — faithful to the live Thrive site (2 columns, row-major).
// All standalone items with image icons + real endpoints. links:[] => standalone.
import fs from 'node:fs';

const BASE = 'http://localhost:8055';
const TOKEN = fs.readFileSync('E:/directus-cms/static-token.txt', 'utf8').trim();
const IMG = '/assets/menu/about';

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

// [title, url, icon]. The live site lays items out row-major; col1/col2 below are
// already in their on-screen vertical order.
const COLUMNS = {
  1: [
    ['Who We Are', '/about/', 'who-we-are-img.svg'],
    ['Why Choose Us?', '/web-marketing-experts/', 'why-choose-img.svg'],
    ['Thrive Score', '/digital-marketing-services/thrive-score/', 'thrive-score.svg'],
    ['ThriveAI', '/thriveai/', 'ThriveAI-thumb.svg'],
    ['Thrive Stats', '/thrive-stats/', 'thirve-stats.svg'],
  ],
  2: [
    ['Careers', '/about/careers/', 'careers-img.svg'],
    ['Client Testimonials', '/real-reviews-from-real-people/', 'client-test-img.svg'],
    ['Thrive Gives Back', '/thrive-gives-back/', 'thrive-gives-img.svg'],
    ['Awards & Recognition', '/awards-recognition/', 'awards-img.svg'],
  ],
};

async function main() {
  await ensureField('mega_menu', { field: 'category_url', type: 'string', meta: { interface: 'input', width: 'half', note: 'Link for the category heading / standalone item' }, schema: {} });
  await ensureField('mega_menu', { field: 'image', type: 'string', meta: { interface: 'input', width: 'half', note: 'Heading image path (takes priority over icon)' }, schema: {} });

  const existing = await api('GET', '/items/mega_menu?filter[menu][_eq]=ABOUT&fields=id&limit=-1');
  const existingIds = existing.ok && Array.isArray(existing.json.data) ? existing.json.data.map((r) => r.id) : [];
  if (existingIds.length) {
    const del = await api('DELETE', '/items/mega_menu', existingIds);
    if (!del.ok) throw new Error('delete existing ABOUT: ' + JSON.stringify(del.json));
    console.log(`cleared ${existingIds.length} existing ABOUT rows`);
  }

  let sort = 1, total = 0;
  for (const col of [1, 2]) {
    for (const [title, url, icon] of COLUMNS[col]) {
      const r = await api('POST', '/items/mega_menu', {
        status: 'published', sort: sort++, menu: 'ABOUT', column: col,
        category: title, icon: '', image: `${IMG}/${icon}`, category_url: url, label: '', url: '',
      });
      if (!r.ok) throw new Error('seed ABOUT row: ' + JSON.stringify(r.json));
      total++;
    }
  }
  console.log(`seeded ${total} ABOUT mega rows`);
  console.log('ABOUT_MEGAMENU_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
