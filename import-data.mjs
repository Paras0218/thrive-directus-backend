// Imports data-export.json into the Postgres-backed Directus via REST API,
// and re-sets the same static token on the admin user so the Astro site keeps
// working unchanged. Strips Directus-managed/system fields so inserts succeed.
import fs from 'node:fs';

// Target + credentials default to local dev, but can be overridden via env vars
// to import into a remote instance, e.g. the Render deployment:
//   $env:DIRECTUS_URL="https://thrive-directus.onrender.com"
//   $env:ADMIN_PASSWORD="<the password you set on Render>"; node import-data.mjs
const BASE = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '387f034d76d94f96Aa1!';
const STATIC_TOKEN = fs.readFileSync('E:/directus-cms/static-token.txt', 'utf8').trim();
const EXPORT = JSON.parse(fs.readFileSync('E:/directus-cms/data-export.json', 'utf8'));

// Auto-managed fields (let Directus/DB assign) + the dropped geometry field.
const STRIP = ['id', 'user_created', 'user_updated', 'date_created', 'date_updated', 'map_location'];

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

function clean(obj) {
  const o = { ...obj };
  for (const k of STRIP) delete o[k];
  return o;
}

async function main() {
  const token = await login();
  console.log('logged in as admin');

  const setTok = await api('PATCH', '/users/me', token, { token: STATIC_TOKEN });
  if (!setTok.ok) throw new Error('set static token: ' + JSON.stringify(setTok.json));
  console.log('static token re-applied to admin user\n');

  let failures = 0;
  for (const [name, entry] of Object.entries(EXPORT)) {
    if (entry.singleton) {
      if (!entry.data) { console.log(`singleton  ${name}: (empty, skip)`); continue; }
      const body = clean(entry.data);
      let r = await api('PATCH', `/items/${name}`, token, body);
      if (!r.ok) r = await api('POST', `/items/${name}`, token, body);
      console.log(`singleton  ${name}: ${r.ok ? 'OK' : 'FAIL ' + JSON.stringify(r.json)}`);
      if (!r.ok) failures++;
    } else {
      const rows = entry.data || [];
      let ok = 0;
      for (const row of rows) {
        const r = await api('POST', `/items/${name}`, token, clean(row));
        if (r.ok) ok++; else { failures++; if (ok === 0) console.log(`  ! ${name}: ${JSON.stringify(r.json)}`); }
      }
      console.log(`collection ${name}: ${ok}/${rows.length} imported`);
    }
  }
  console.log(`\nIMPORT_DONE (${failures} failure${failures === 1 ? '' : 's'})`);
}

main().catch((e) => { console.error('IMPORT_ERROR:', e.message); process.exit(1); });
