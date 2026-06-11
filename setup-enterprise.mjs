// Creates the `enterprise` singleton (Enterprise Digital Marketing page) + all
// fields, then seeds it with the WP-reconstructed content from
// enterprise-seed-raw.json. Delimiters are normalized to the page parser's
// format ("|" rows, "||" service blocks). Idempotent + env-var aware:
//   $env:DIRECTUS_URL="https://thrive-directus-backend.onrender.com"
//   $env:ADMIN_PASSWORD="<prod admin password>"; node setup-enterprise.mjs
import fs from 'node:fs';

const BASE = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '387f034d76d94f96Aa1!';
const raw = JSON.parse(fs.readFileSync('E:/directus-cms/enterprise-seed-raw.json', 'utf8'));

// ── Normalize each row-field to the parser's "|" / "||" convention ──────────
const perLine = (s, fn) => (s || '').split('\n').map(fn).join('\n');
const seed = { ...raw };
seed.why_items = perLine(raw.why_items, (l) => l.replace(/\s~\s/, ' | '));            // "Title ~ Desc"
seed.whychoose_items = perLine(raw.whychoose_items, (l) => l.replace(/\s\/\s/, ' | ')); // "Title / Desc"
seed.included_s1_items = perLine(raw.included_s1_items, (l) => l.replace(/\s[—–]\s/, ' | ')); // "Title — Desc"
seed.services_subitems = perLine(raw.services_subitems, (l) => l.replace(/\s;\s/g, ' | ')); // "N ; Title ; Desc"
seed.faqs_items = perLine(raw.faqs_items, (l) => l.replace(/\?\s/, '? | '));           // "Question? Answer"
// The FAQ agent duplicated the "Why Choose" copy into the closing CTA — replace
// with a clean, on-brand, editable closing CTA.
seed.cta_h2 = 'Partner With a Leading Enterprise Digital Marketing Agency';
seed.cta_text = "Scale your brand with data-driven, omnichannel enterprise marketing built around your goals. Get a free, no-obligation proposal from Thrive's enterprise specialists.";
seed.cta_btn1_text = raw.cta_btn1_text || 'GET MY FREE PROPOSAL';
seed.cta_btn1_url = '/';
seed.cta_btn2_text = raw.cta_btn2_text || 'CALL (888) 342-0534';

async function api(method, path, token, body, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      if (attempt >= tries) throw e; await new Promise((r) => setTimeout(r, 1500 * attempt)); continue;
    }
    const text = await res.text();
    let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    // Retry on the free-tier "under pressure" / rate-limit responses.
    if ((res.status === 503 || res.status === 429) && attempt < tries) {
      await new Promise((r) => setTimeout(r, 2000 * attempt)); continue;
    }
    return { ok: res.ok, status: res.status, json };
  }
}

async function login() {
  const r = await api('POST', '/auth/login', null, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!r.ok) throw new Error('Login failed: ' + JSON.stringify(r.json));
  return r.json.data.access_token;
}

const PK = { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } };
const str = (field) => ({ field, type: 'string', meta: { interface: 'input', width: 'full' }, schema: {} });
const txt = (field) => ({ field, type: 'text', meta: { interface: 'input-multiline', width: 'full' }, schema: {} });

async function ensureCollection(token, def) {
  const exists = await api('GET', `/collections/${def.collection}`, token);
  if (exists.ok) { console.log(`= collection ${def.collection} (exists)`); return; }
  const r = await api('POST', '/collections', token, def);
  if (!r.ok) throw new Error(`create collection: ` + JSON.stringify(r.json));
  console.log(`+ collection ${def.collection}`);
}
async function ensureField(token, collection, def) {
  const exists = await api('GET', `/fields/${collection}/${def.field}`, token);
  if (exists.ok) return;
  const r = await api('POST', `/fields/${collection}`, token, def);
  if (!r.ok) throw new Error(`create field ${def.field}: ` + JSON.stringify(r.json));
  console.log(`+ ${collection}.${def.field}`);
}

async function main() {
  const token = await login();
  console.log('logged in to', BASE);

  await ensureCollection(token, {
    collection: 'enterprise',
    meta: { icon: 'corporate_fare', singleton: true, note: 'Enterprise Digital Marketing page content' },
    schema: {}, fields: [PK],
  });

  // Create a field per seed key; long/multiline values -> text, else string.
  for (const [field, value] of Object.entries(seed)) {
    const long = /\n/.test(String(value)) || String(value).length > 100;
    await ensureField(token, 'enterprise', long ? txt(field) : str(field));
  }

  let r = await api('PATCH', '/items/enterprise', token, seed);
  if (!r.ok) r = await api('POST', '/items/enterprise', token, seed);
  if (!r.ok) throw new Error('seed enterprise: ' + JSON.stringify(r.json));
  console.log('enterprise content seeded —', Object.keys(seed).length, 'fields');
  console.log('DONE');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
