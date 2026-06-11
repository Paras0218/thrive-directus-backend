// Recreates the `about` singleton (base + Optimize/Generate/Grow fields), seeds
// it with the default About content, and ensures the ABOUT -> /about nav item
// exists. Idempotent + env-var aware:
//   $env:DIRECTUS_URL="https://thrive-directus-backend.onrender.com"
//   $env:ADMIN_PASSWORD="<prod admin password>"; node setup-about.mjs
const BASE = process.env.DIRECTUS_URL || 'http://localhost:8055';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '387f034d76d94f96Aa1!';

const seed = {
  seo_title: 'About Us | ThriveAgency Clone',
  seo_description:
    'We are a growth-obsessed digital marketing team pairing creative strategy with engineering rigor to drive measurable revenue.',
  hero_eyebrow: 'About The Agency',
  hero_heading: 'Growth-obsessed marketers, engineering-grade execution.',
  hero_subheading:
    'We blend creative strategy with a fast, headless tech stack to turn marketing spend into predictable, compounding revenue for ambitious brands.',
  story_heading: 'Our Story',
  story_body:
    'Founded on a simple belief — that marketing should be measurable — we set out to close the gap between brand storytelling and hard revenue.\n\nToday we run full-funnel programs for companies that want more than vanity metrics. Every campaign is wired to a structured data layer, so the impact of every dollar is transparent and accountable.',
  stat1_value: '12+', stat1_label: 'Years of combined expertise',
  stat2_value: '$250M+', stat2_label: 'Client revenue influenced',
  stat3_value: '500+', stat3_label: 'Campaigns launched',
  stat4_value: '98%', stat4_label: 'Client retention rate',
  mission_heading: 'Our Mission',
  mission_body:
    'To be the most accountable growth partner our clients have ever worked with — obsessed with outcomes, allergic to fluff, and relentless about the numbers that actually move the business.',
  cta_heading: 'Ready to drive real growth?',
  cta_text: 'Tell us about your objectives and we will put together a tailored proposal.',
  cta_button_label: 'Get Your Free Proposal',
  cta_button_url: '/',
  og_intro:
    'Thrive Internet Marketing Agency is an award-winning digital marketing company that offers a full spectrum of data-driven web marketing services. We develop growth-oriented online marketing campaigns that make a positive impact on businesses.',
  og_card1_icon: 'settings', og_card1_title: 'OPTIMIZE', og_card1_sub: 'Marketing Processes',
  og_card2_icon: 'circle-check', og_card2_title: 'GENERATE', og_card2_sub: 'Targeted Results',
  og_card3_icon: 'bar-chart-3', og_card3_title: 'GROW', og_card3_sub: 'Your Brand Online',
  og_cta1_text: 'STRATEGY-FIRST AGENCY', og_cta1_url: '/',
  og_cta2_text: 'GET MY FREE PROPOSAL', og_cta2_url: '/',
};

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
const PK = { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } };
const str = (field) => ({ field, type: 'string', meta: { interface: 'input', width: 'full' }, schema: {} });
const txt = (field) => ({ field, type: 'text', meta: { interface: 'input-multiline', width: 'full' }, schema: {} });
async function ensureCollection(token, def) {
  const exists = await api('GET', `/collections/${def.collection}`, token);
  if (exists.ok) { console.log(`= collection ${def.collection} (exists)`); return; }
  const r = await api('POST', '/collections', token, def);
  if (!r.ok) throw new Error('create collection: ' + JSON.stringify(r.json));
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
    collection: 'about',
    meta: { icon: 'info', singleton: true, note: 'About page content' },
    schema: {}, fields: [PK],
  });
  for (const [field, value] of Object.entries(seed)) {
    const long = /\n/.test(String(value)) || String(value).length > 100;
    await ensureField(token, 'about', long ? txt(field) : str(field));
  }
  let r = await api('PATCH', '/items/about', token, seed);
  if (!r.ok) r = await api('POST', '/items/about', token, seed);
  if (!r.ok) throw new Error('seed about: ' + JSON.stringify(r.json));
  console.log('about content seeded —', Object.keys(seed).length, 'fields');

  // Ensure ABOUT -> /about nav item exists.
  const nav = await api('GET', '/items/nav_items?fields=id,url&limit=-1', token);
  const has = (nav.ok && Array.isArray(nav.json.data) ? nav.json.data : []).some((x) => x.url === '/about');
  if (has) { console.log('= nav ABOUT (exists)'); }
  else {
    const add = await api('POST', '/items/nav_items', token, { status: 'published', sort: 4, label: 'ABOUT', url: '/about', has_dropdown: false });
    if (!add.ok) throw new Error('add nav ABOUT: ' + JSON.stringify(add.json));
    console.log('+ nav ABOUT -> /about');
  }
  console.log('DONE');
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
