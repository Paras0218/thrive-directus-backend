// Groups all homepage section collections under one "Home" folder in Directus,
// per the project convention (folders by area). Idempotent: safe to re-run.
// NOTE: the folder is named `home` (not `homepage`) because the homepage singleton
// already owns the `homepage` collection key.
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

const FOLDER = 'home';
// Order shown inside the folder (homepage singleton first, then sections top→bottom)
const MEMBERS = ['homepage', 'home_results', 'home_wins', 'home_aiv', 'home_tools', 'home_values', 'testimonials'];

async function main() {
  const exists = await api('GET', `/collections/${FOLDER}`);
  if (exists.ok) {
    console.log(`= folder ${FOLDER} (exists)`);
  } else {
    const r = await api('POST', '/collections', {
      collection: FOLDER,
      meta: { icon: 'home', note: 'Homepage content — general/hero singleton + each homepage section', color: '#7ab317', sort: 2 },
      schema: null,
    });
    if (!r.ok) throw new Error('create folder: ' + JSON.stringify(r.json));
    console.log(`+ folder ${FOLDER}`);
  }

  let sort = 1;
  for (const c of MEMBERS) {
    const r = await api('PATCH', `/collections/${c}`, { meta: { group: FOLDER, sort: sort++ } });
    if (!r.ok) throw new Error(`group ${c}: ` + JSON.stringify(r.json));
    console.log(`  → ${c} moved into ${FOLDER}`);
  }

  console.log('HOMEPAGE_GROUP_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
