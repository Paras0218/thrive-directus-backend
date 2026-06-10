// Idempotent setup for the CMS-editable About page (singleton + fields + seed).
import fs from 'node:fs';

const BASE = 'http://localhost:8055';
const TOKEN = fs.readFileSync('E:/Thrive-astro/directus-cms/static-token.txt', 'utf8').trim();

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
const txt = (field) => ({ field, type: 'text', meta: { interface: 'input-multiline', width: 'full' }, schema: {} });

async function main() {
  await ensureCollection({
    collection: 'about',
    meta: { icon: 'info', singleton: true, note: 'Editable About page content' },
    schema: {},
    fields: [PK],
  });

  const fields = [
    str('seo_title'), txt('seo_description'),
    str('hero_eyebrow'), str('hero_heading'), txt('hero_subheading'),
    str('story_heading'), txt('story_body'),
    str('stat1_value', 'half'), str('stat1_label', 'half'),
    str('stat2_value', 'half'), str('stat2_label', 'half'),
    str('stat3_value', 'half'), str('stat3_label', 'half'),
    str('stat4_value', 'half'), str('stat4_label', 'half'),
    str('mission_heading'), txt('mission_body'),
    str('cta_heading'), txt('cta_text'),
    str('cta_button_label', 'half'), str('cta_button_url', 'half'),
  ];
  for (const f of fields) await ensureField('about', f);

  const content = {
    seo_title: 'About Us | ThriveAgency Clone',
    seo_description: 'We are a growth-obsessed digital marketing team pairing creative strategy with engineering rigor to drive measurable revenue.',
    hero_eyebrow: 'About The Agency',
    hero_heading: 'Growth-obsessed marketers, engineering-grade execution.',
    hero_subheading: 'We blend creative strategy with a fast, headless tech stack to turn marketing spend into predictable, compounding revenue for ambitious brands.',
    story_heading: 'Our Story',
    story_body: 'Founded on a simple belief — that marketing should be measurable — we set out to close the gap between brand storytelling and hard revenue.\n\nToday we run full-funnel programs for companies that want more than vanity metrics. Every campaign is wired to a structured data layer, so the impact of every dollar is transparent and accountable.',
    stat1_value: '12+', stat1_label: 'Years of combined expertise',
    stat2_value: '$250M+', stat2_label: 'Client revenue influenced',
    stat3_value: '500+', stat3_label: 'Campaigns launched',
    stat4_value: '98%', stat4_label: 'Client retention rate',
    mission_heading: 'Our Mission',
    mission_body: 'To be the most accountable growth partner our clients have ever worked with — obsessed with outcomes, allergic to fluff, and relentless about the numbers that actually move the business.',
    cta_heading: 'Ready to drive real growth?',
    cta_text: 'Tell us about your objectives and we will put together a tailored proposal.',
    cta_button_label: 'Get Your Free Proposal',
    cta_button_url: '/',
  };
  let seed = await api('PATCH', '/items/about', content);
  if (!seed.ok) seed = await api('POST', '/items/about', content);
  if (!seed.ok) throw new Error('seed about: ' + JSON.stringify(seed.json));
  console.log('about content seeded');
  console.log('ABOUT_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
