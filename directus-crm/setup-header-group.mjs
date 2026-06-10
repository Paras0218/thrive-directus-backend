// Groups all header-related collections under one "Site Header" folder in Directus,
// so everything that affects the site header is editable in one place.
// Idempotent: safe to re-run.
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

const FOLDER = 'site_header';
// Order shown inside the folder
const MEMBERS = ['header', 'nav_items', 'mega_menu', 'result_cards', 'services_promo'];

async function main() {
  // 1) Create the folder (a presentational collection: schema = null = no table)
  const exists = await api('GET', `/collections/${FOLDER}`);
  if (exists.ok) {
    console.log(`= folder ${FOLDER} (exists)`);
  } else {
    const r = await api('POST', '/collections', {
      collection: FOLDER,
      meta: { icon: 'menu', note: 'Everything in the site header — logo/phone, top nav, mega-menus, result cards, promo', color: '#7ab317', sort: 1 },
      schema: null,
    });
    if (!r.ok) throw new Error(`create folder: ` + JSON.stringify(r.json));
    console.log(`+ folder ${FOLDER}`);
  }

  // 2) Put each header collection inside the folder, in order
  let sort = 1;
  for (const c of MEMBERS) {
    const r = await api('PATCH', `/collections/${c}`, { meta: { group: FOLDER, sort: sort++ } });
    if (!r.ok) throw new Error(`group ${c}: ` + JSON.stringify(r.json));
    console.log(`  → ${c} moved into ${FOLDER}`);
  }

  console.log('HEADER_GROUP_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
