// Idempotent setup for the SERVICES mega-menu promo panel (green "Experience Real Results").
// Singleton — CMS-editable text + image paths for the box shown left of the SERVICES menu.
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
const txt = (field, note) => ({ field, type: 'text', meta: { interface: 'input-multiline', width: 'full', ...(note ? { note } : {}) }, schema: {} });

async function main() {
  await ensureCollection({
    collection: 'services_promo',
    meta: { icon: 'campaign', singleton: true, note: 'Green promo box on the left of the SERVICES mega-menu' },
    schema: {},
    fields: [PK],
  });

  await ensureField('services_promo', {
    field: 'enabled', type: 'boolean',
    meta: { interface: 'boolean', width: 'half', note: 'Show the promo box in the SERVICES menu' },
    schema: { default_value: true },
  });
  const fields = [
    str('heading', 'full', 'Headline, e.g. Experience Real Results'),
    txt('description', 'Short paragraph under the headline'),
    str('group_image', 'full', 'Avatars image path, e.g. /assets/menu/services/resultgroup-image.png'),
    str('input_placeholder', 'half'),
    str('button_text', 'half'),
    str('button_url', 'full', 'Where the form submits / button links, e.g. /'),
    str('phone_image', 'full', 'Phone background image (incl. wavy line), e.g. /assets/menu/services/menu_smartphone_img01.png'),
    str('logo_image', 'full', 'Client logo path, e.g. /assets/menu/services/logo-1.svg'),
    str('stat1_value', 'half'), str('stat1_label', 'half'),
    str('stat2_value', 'half'), str('stat2_label', 'half'),
    str('stat3_value', 'half'), str('stat3_label', 'half'),
  ];
  for (const f of fields) await ensureField('services_promo', f);

  const content = {
    enabled: true,
    heading: 'Experience Real Results',
    description: 'Partner with Thrive Internet Marketing Agency and scale your business.',
    group_image: '/assets/menu/services/resultgroup-image.png',
    input_placeholder: 'Enter Your Website Address',
    button_text: 'SEND MY FREE PROPOSAL',
    button_url: '/',
    phone_image: '/assets/menu/services/menu_smartphone_img01.png',
    logo_image: '/assets/menu/services/logo-1.svg',
    stat1_value: '+500%', stat1_label: 'Impressions',
    stat2_value: '+60%', stat2_label: 'New Followers',
    stat3_value: '+190%', stat3_label: 'Engagement',
  };
  let seed = await api('PATCH', '/items/services_promo', content);
  if (!seed.ok) seed = await api('POST', '/items/services_promo', content);
  if (!seed.ok) throw new Error('seed services_promo: ' + JSON.stringify(seed.json));
  console.log('services_promo content seeded');
  console.log('SERVICES_PROMO_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
