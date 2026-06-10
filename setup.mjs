// One-shot, idempotent Directus setup for the Astro homepage.
// Creates collections/fields, sets a static admin token, and seeds content.
import crypto from 'node:crypto';
import fs from 'node:fs';

const BASE = 'http://localhost:8055';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = '387f034d76d94f96Aa1!';
const STATIC_TOKEN = process.env.STATIC_TOKEN || crypto.randomBytes(24).toString('hex');

async function api(method, path, token, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

async function ensureCollection(token, def) {
  const exists = await api('GET', `/collections/${def.collection}`, token);
  if (exists.ok) { console.log(`= collection ${def.collection} (exists)`); return; }
  const r = await api('POST', '/collections', token, def);
  if (!r.ok) throw new Error(`create collection ${def.collection}: ` + JSON.stringify(r.json));
  console.log(`+ collection ${def.collection}`);
}

async function ensureField(token, collection, def) {
  const exists = await api('GET', `/fields/${collection}/${def.field}`, token);
  if (exists.ok) { console.log(`  = ${collection}.${def.field} (exists)`); return; }
  const r = await api('POST', `/fields/${collection}`, token, def);
  if (!r.ok) throw new Error(`create field ${collection}.${def.field}: ` + JSON.stringify(r.json));
  console.log(`  + ${collection}.${def.field}`);
}

const PK = {
  field: 'id', type: 'integer',
  meta: { hidden: true, interface: 'input', readonly: true },
  schema: { is_primary_key: true, has_auto_increment: true },
};
const str = (field, width = 'full') => ({
  field, type: 'string',
  meta: { interface: 'input', width },
  schema: {},
});
const txt = (field) => ({
  field, type: 'text',
  meta: { interface: 'input-multiline', width: 'full' },
  schema: {},
});

async function main() {
  const token = await login();
  console.log('logged in as admin');

  const setTok = await api('PATCH', '/users/me', token, { token: STATIC_TOKEN });
  if (!setTok.ok) throw new Error('set static token: ' + JSON.stringify(setTok.json));
  console.log('static token set on admin user');

  // --- homepage (singleton) ---
  await ensureCollection(token, {
    collection: 'homepage',
    meta: { icon: 'home', singleton: true, note: 'Editable homepage content' },
    schema: {},
    fields: [PK],
  });
  const homepageFields = [
    str('seo_title'), txt('seo_description'),
    str('hero_eyebrow'), str('hero_heading'), txt('hero_subheading'),
    str('services_heading'), txt('services_subheading'),
    str('form_heading'),
    str('form_name_label', 'half'), str('form_email_label', 'half'),
    str('form_website_label', 'half'), str('form_message_label', 'half'),
    str('form_button_label', 'half'), str('form_success_message', 'full'),
  ];
  for (const f of homepageFields) await ensureField(token, 'homepage', f);

  // --- services ---
  await ensureCollection(token, {
    collection: 'services',
    meta: { icon: 'category', note: 'Service cards on the homepage', sort_field: 'sort' },
    schema: {},
    fields: [PK],
  });
  await ensureField(token, 'services', {
    field: 'status', type: 'string',
    schema: { default_value: 'draft' },
    meta: {
      interface: 'select-dropdown', width: 'half', display: 'labels',
      options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }] },
    },
  });
  await ensureField(token, 'services', { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} });
  await ensureField(token, 'services', str('title'));
  await ensureField(token, 'services', txt('description'));

  // --- leads ---
  await ensureCollection(token, {
    collection: 'leads',
    meta: { icon: 'inbox', note: 'Homepage lead submissions' },
    schema: {},
    fields: [PK],
  });
  await ensureField(token, 'leads', { field: 'name', type: 'string', meta: { interface: 'input', width: 'half', required: true }, schema: { is_nullable: false } });
  await ensureField(token, 'leads', { field: 'email', type: 'string', meta: { interface: 'input', width: 'half', required: true }, schema: { is_nullable: false } });
  await ensureField(token, 'leads', str('website', 'half'));
  await ensureField(token, 'leads', txt('message'));
  await ensureField(token, 'leads', {
    field: 'date_created', type: 'timestamp',
    meta: { special: ['date-created'], interface: 'datetime', readonly: true, hidden: true, width: 'half', display: 'datetime' },
    schema: {},
  });

  // --- seed homepage content ---
  const homepage = {
    seo_title: 'ThriveAgency Clone | Pure Performance Marketing',
    seo_description: 'Full-service digital marketing agency driving tangible revenue and digital scale through a fast Astro frontend and a structured MySQL data layer.',
    hero_eyebrow: 'Full-Service Digital Marketing Agency',
    hero_heading: 'We Drive Tangible Revenue & Digital Scale.',
    hero_subheading: 'Powered by an ultra-fast Astro frontend wrapper processing real-time interactions securely through a structured MySQL database layer.',
    services_heading: 'Our Core Expertise',
    services_subheading: 'Dynamic capability managed inside Directus, compiled directly into pure HTML optimization blocks.',
    form_heading: 'Get Your Free Proposal',
    form_name_label: 'Full Name*',
    form_email_label: 'Email Address*',
    form_website_label: 'Website URL',
    form_message_label: 'Message',
    form_button_label: 'Request Proposal',
    form_success_message: 'Success! Our growth experts will look into this.',
  };
  let seedHome = await api('PATCH', '/items/homepage', token, homepage);
  if (!seedHome.ok) seedHome = await api('POST', '/items/homepage', token, homepage);
  if (!seedHome.ok) throw new Error('seed homepage: ' + JSON.stringify(seedHome.json));
  console.log('homepage content seeded');

  // --- seed services (only if empty) ---
  const existing = await api('GET', '/items/services?limit=1', token);
  const count = existing.ok && Array.isArray(existing.json.data) ? existing.json.data.length : 0;
  if (count === 0) {
    const services = [
      { status: 'published', sort: 1, title: 'SEO & Content', description: 'Data-driven organic growth: technical SEO, content strategy, and authority building that compounds over time.' },
      { status: 'published', sort: 2, title: 'Paid Media (PPC)', description: 'Full-funnel paid campaigns across Google, Meta, and LinkedIn engineered for measurable, repeatable ROI.' },
      { status: 'published', sort: 3, title: 'Web Design & CRO', description: 'High-performance, conversion-optimized websites that turn traffic into qualified sales pipeline.' },
      { status: 'published', sort: 4, title: 'Social Media', description: 'Always-on social strategy and creative that builds brand affinity and sustained demand.' },
      { status: 'published', sort: 5, title: 'Email & Automation', description: 'Lifecycle email and marketing automation that nurtures leads into loyal, high-value customers.' },
      { status: 'published', sort: 6, title: 'Analytics & Reporting', description: 'Transparent dashboards and attribution modeling so every marketing dollar is tied to revenue.' },
    ];
    for (const s of services) {
      const r = await api('POST', '/items/services', token, s);
      if (!r.ok) throw new Error('seed service: ' + JSON.stringify(r.json));
    }
    console.log(`seeded ${services.length} services`);
  } else {
    console.log('services already present, skip seed');
  }

  fs.writeFileSync('E:/Thrive-astro/directus-cms/static-token.txt', STATIC_TOKEN);
  console.log('STATIC_TOKEN=' + STATIC_TOKEN);
  console.log('SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
