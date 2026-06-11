// Removes the About + Contact pages from Directus: deletes the `about` and
// `contact_page` collections (drops their tables) and any nav_items row that
// links to /about or /contact. Idempotent + env-var aware:
//   $env:DIRECTUS_URL="https://thrive-directus-backend.onrender.com"
//   $env:ADMIN_PASSWORD="<prod admin password>"; node cleanup-about-contact.mjs
const BASE = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '387f034d76d94f96Aa1!';
const DEAD_URLS = ['/about', '/contact'];
const COLLECTIONS = ['about', 'contact_page'];

async function api(method, path, token, body, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) { if (attempt >= tries) throw e; await new Promise((r) => setTimeout(r, 1500 * attempt)); continue; }
    const text = await res.text();
    let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = text; }
    if ((res.status === 503 || res.status === 429) && attempt < tries) { await new Promise((r) => setTimeout(r, 2000 * attempt)); continue; }
    return { ok: res.ok, status: res.status, json };
  }
}

async function login() {
  const r = await api('POST', '/auth/login', null, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!r.ok) throw new Error('Login failed: ' + JSON.stringify(r.json));
  return r.json.data.access_token;
}

async function main() {
  const token = await login();
  console.log('logged in to', BASE);

  // 1) Remove dead nav links.
  const nav = await api('GET', '/items/nav_items?fields=id,label,url&limit=-1', token);
  const dead = (nav.ok && Array.isArray(nav.json.data) ? nav.json.data : []).filter((r) => DEAD_URLS.includes(r.url));
  for (const r of dead) {
    const del = await api('DELETE', `/items/nav_items/${r.id}`, token);
    console.log(`${del.ok ? '-' : '!'} nav_items ${r.id} (${r.label} -> ${r.url})`);
  }
  if (!dead.length) console.log('= no /about or /contact nav rows');

  // 2) Drop the collections (removes their DB tables + data).
  for (const c of COLLECTIONS) {
    const exists = await api('GET', `/collections/${c}`, token);
    if (!exists.ok) { console.log(`= collection ${c} (already gone)`); continue; }
    const del = await api('DELETE', `/collections/${c}`, token);
    if (!del.ok && del.status !== 204) throw new Error(`delete collection ${c}: ` + JSON.stringify(del.json));
    console.log(`- collection ${c} dropped`);
  }
  console.log('DONE');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
