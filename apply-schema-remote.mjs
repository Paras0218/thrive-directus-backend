// Pushes the local schema snapshot into a REMOTE Directus over HTTP (no DB access
// needed) via the /schema/diff + /schema/apply endpoints. Run BEFORE import-data.mjs.
//   $env:DIRECTUS_URL="https://astro-headless-directus.onrender.com"
//   $env:ADMIN_PASSWORD="<your Render Directus admin password>"; node apply-schema-remote.mjs
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const yaml = require('js-yaml');

const BASE = process.env.DIRECTUS_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!BASE || !ADMIN_PASSWORD) {
  console.error('Set DIRECTUS_URL and ADMIN_PASSWORD env vars first.');
  process.exit(1);
}

const snapshot = yaml.load(fs.readFileSync('E:/directus-cms/snapshot.yaml', 'utf8'));

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

async function main() {
  const login = await api('POST', '/auth/login', null, { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  if (!login.ok) throw new Error('login failed: ' + JSON.stringify(login.json));
  const token = login.json.data.access_token;
  console.log('logged in to', BASE);

  // force=true bypasses the vendor/version hash check (snapshot was taken on MySQL).
  const diff = await api('POST', '/schema/diff?force=true', token, snapshot);
  if (diff.status === 204 || !diff.json) { console.log('No schema changes needed (already in sync).'); return; }
  if (!diff.ok) throw new Error('diff failed: ' + JSON.stringify(diff.json));
  console.log('diff computed, applying schema...');

  const apply = await api('POST', '/schema/apply', token, diff.json.data);
  if (!apply.ok) throw new Error('apply failed: ' + JSON.stringify(apply.json));
  console.log('SCHEMA_APPLIED');
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
