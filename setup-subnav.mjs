// Idempotent setup for nav dropdown sub-items (nav_subitems + M2O to nav_items + seed).
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
const str = (field, width = 'full') => ({ field, type: 'string', meta: { interface: 'input', width }, schema: {} });

async function main() {
  await ensureCollection({
    collection: 'nav_subitems',
    meta: { icon: 'subdirectory_arrow_right', note: 'Dropdown sub-links for header menu items', sort_field: 'sort', hidden: true },
    schema: {},
    fields: [PK],
  });
  await ensureField('nav_subitems', {
    field: 'status', type: 'string',
    schema: { default_value: 'draft' },
    meta: {
      interface: 'select-dropdown', width: 'half', display: 'labels',
      options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }] },
    },
  });
  await ensureField('nav_subitems', { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} });
  await ensureField('nav_subitems', str('label', 'half'));
  await ensureField('nav_subitems', str('url', 'half'));

  // parent (M2O -> nav_items): field + relation
  const parentField = await api('GET', '/fields/nav_subitems/parent');
  if (!parentField.ok) {
    const r = await api('POST', '/fields/nav_subitems', {
      field: 'parent', type: 'integer',
      meta: { interface: 'select-dropdown-m2o', special: ['m2o'], options: { template: '{{label}}' }, width: 'half' },
      schema: {},
    });
    if (!r.ok) throw new Error('create parent field: ' + JSON.stringify(r.json));
    console.log('  + nav_subitems.parent (m2o field)');
  } else { console.log('  = nav_subitems.parent (exists)'); }

  const rel = await api('GET', '/relations/nav_subitems/parent');
  if (!rel.ok) {
    const r = await api('POST', '/relations', {
      collection: 'nav_subitems', field: 'parent', related_collection: 'nav_items',
      schema: { on_delete: 'SET NULL' },
    });
    if (!r.ok) throw new Error('create relation: ' + JSON.stringify(r.json));
    console.log('  + relation nav_subitems.parent -> nav_items');
  } else { console.log('  = relation nav_subitems.parent (exists)'); }

  // O2M alias on nav_items so each parent shows its children inline (Subitems list)
  const o2m = await api('GET', '/fields/nav_items/subitems');
  if (!o2m.ok) {
    const r = await api('POST', '/fields/nav_items', {
      field: 'subitems', type: 'alias',
      meta: { interface: 'list-o2m', special: ['o2m'], options: { template: '{{label}}' }, width: 'full', note: 'Dropdown sub-links for this menu item' },
      schema: null,
    });
    if (!r.ok) throw new Error('create o2m field: ' + JSON.stringify(r.json));
    console.log('  + nav_items.subitems (o2m alias)');
  } else { console.log('  = nav_items.subitems (exists)'); }
  // NOTE: Do NOT PATCH the relation's one_field via the API. In this Directus
  // build that runs RelationsService.alterType() and CRASHES the server
  // (TypeError: Cannot read properties of undefined (reading 'fields')).
  // Set the O2M link directly in the DB instead, then restart Directus:
  //   UPDATE directus_relations SET one_field='subitems'
  //   WHERE many_collection='nav_subitems' AND many_field='parent';
  // (Already applied to this database; the DB dump preserves it.)

  // map parent label -> id
  const navRes = await api('GET', '/items/nav_items?limit=-1&fields=id,label');
  const byLabel = {};
  if (navRes.ok && Array.isArray(navRes.json.data)) {
    for (const n of navRes.json.data) byLabel[n.label] = n.id;
  }

  // seed sub-items only if empty
  const existing = await api('GET', '/items/nav_subitems?limit=1');
  const count = existing.ok && Array.isArray(existing.json.data) ? existing.json.data.length : 0;
  if (count === 0) {
    const groups = {
      SERVICES: ['SEO', 'Pay Per Click (PPC)', 'Web Design', 'Social Media', 'Email Marketing', 'Amazon Marketing'],
      LOCAL: ['Local SEO', 'Google Business Profile', 'Local PPC'],
      RESULTS: ['Case Studies', 'Reviews & Testimonials', 'Awards'],
      ABOUT: ['Our Story', 'Our Team', 'Careers'],
      LEARN: ['Blog', 'Guides & eBooks', 'Webinars'],
    };
    let total = 0;
    for (const [label, links] of Object.entries(groups)) {
      const parentId = byLabel[label];
      if (!parentId) { console.log(`! no nav item for '${label}', skipping`); continue; }
      let sort = 1;
      for (const linkLabel of links) {
        const r = await api('POST', '/items/nav_subitems', {
          status: 'published', sort: sort++, label: linkLabel, url: '#', parent: parentId,
        });
        if (!r.ok) throw new Error('seed subitem: ' + JSON.stringify(r.json));
        total++;
      }
    }
    console.log(`seeded ${total} sub-items`);
  } else {
    console.log('sub-items already present, skip seed');
  }

  console.log('SUBNAV_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
