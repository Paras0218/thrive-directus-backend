// Adds the "Optimize / Generate / Grow" section fields to the `about` singleton
// and seeds them. Idempotent. Works on local or remote Directus via env vars:
//   $env:DIRECTUS_URL="https://thrive-directus-backend.onrender.com"
//   $env:ADMIN_PASSWORD="<prod admin password>"; node setup-about-og.mjs
const BASE = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '387f034d76d94f96Aa1!';

async function api(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { ok: res.ok, status: res.status, json };
}

async function login() {
  const r = await api('POST', '/auth/login', null, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!r.ok) throw new Error('Login failed: ' + JSON.stringify(r.json));
  return r.json.data.access_token;
}

async function ensureField(token, collection, def) {
  const exists = await api('GET', `/fields/${collection}/${def.field}`, token);
  if (exists.ok) { console.log(`  = ${collection}.${def.field} (exists)`); return; }
  const r = await api('POST', `/fields/${collection}`, token, def);
  if (!r.ok) throw new Error(`create field ${collection}.${def.field}: ` + JSON.stringify(r.json));
  console.log(`  + ${collection}.${def.field}`);
}

const str = (field, width = 'full', note = null) => ({
  field, type: 'string',
  meta: { interface: 'input', width, ...(note ? { note } : {}) },
  schema: {},
});
const txt = (field, note = null) => ({
  field, type: 'text',
  meta: { interface: 'input-multiline', width: 'full', ...(note ? { note } : {}) },
  schema: {},
});

async function main() {
  const token = await login();
  console.log('logged in to', BASE);

  const fields = [
    txt('og_intro', 'Intro paragraph above the Optimize/Generate/Grow cards'),
    str('og_card1_icon', 'half', 'Lucide icon name, e.g. settings'),
    str('og_card1_title', 'half'),
    str('og_card1_sub', 'full'),
    str('og_card2_icon', 'half', 'Lucide icon name, e.g. circle-check'),
    str('og_card2_title', 'half'),
    str('og_card2_sub', 'full'),
    str('og_card3_icon', 'half', 'Lucide icon name, e.g. bar-chart-3'),
    str('og_card3_title', 'half'),
    str('og_card3_sub', 'full'),
    str('og_cta1_text', 'half'),
    str('og_cta1_url', 'half'),
    str('og_cta2_text', 'half'),
    str('og_cta2_url', 'half'),
  ];
  for (const f of fields) await ensureField(token, 'about', f);

  // Seed content (matches the requested design). PATCH never clobbers other fields.
  const seed = {
    og_intro:
      'Thrive Internet Marketing Agency is an award-winning digital marketing company that offers a full spectrum of data-driven web marketing services. We develop growth-oriented online marketing campaigns that make a positive impact on businesses.',
    og_card1_icon: 'settings', og_card1_title: 'OPTIMIZE', og_card1_sub: 'Marketing Processes',
    og_card2_icon: 'circle-check', og_card2_title: 'GENERATE', og_card2_sub: 'Targeted Results',
    og_card3_icon: 'bar-chart-3', og_card3_title: 'GROW', og_card3_sub: 'Your Brand Online',
    og_cta1_text: 'STRATEGY-FIRST AGENCY', og_cta1_url: '/',
    og_cta2_text: 'GET MY FREE PROPOSAL', og_cta2_url: '/',
  };
  const r = await api('PATCH', '/items/about', token, seed);
  if (!r.ok) throw new Error('seed about: ' + JSON.stringify(r.json));
  console.log('about Optimize/Generate/Grow content seeded');
  console.log('DONE');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
