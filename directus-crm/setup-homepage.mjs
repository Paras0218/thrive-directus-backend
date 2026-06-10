// Homepage singleton — CMS-editable text for the Thrive homepage (grows per section).
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
const txt = (field, note) => ({ field, type: 'text', meta: { interface: 'input-multiline', width: 'full', ...(note ? { note } : {}) }, schema: {} });

async function main() {
  await ensureCollection({
    collection: 'homepage',
    meta: { icon: 'home', singleton: true, note: 'Editable homepage content' },
    schema: {},
    fields: [PK],
  });

  const fields = [
    str('seo_title'), txt('seo_description'),
    // hero
    str('hero_eyebrow'),
    str('hero_heading_pre', 'half'), str('hero_heading_em', 'half'),
    txt('hero_sub'),
    txt('hero_trust_list', 'One bullet per line'),
    str('hero_team_label'),
    // hero form
    str('form_eyebrow', 'half'), str('form_headline'),
    txt('form_sub'),
    str('form_button', 'half'), str('form_fineprint'),
    str('form_success_heading', 'half'), txt('form_success_text'),
  ];
  for (const f of fields) await ensureField('homepage', f);

  const content = {
    seo_title: 'Digital Marketing Agency Driven by Relationships and Results | Thrive',
    seo_description: 'Thrive is a digital marketing agency that delivers booked leads and measurable revenue growth. Free strategy proposal, no long-term contracts.',
    hero_eyebrow: 'Free Digital Marketing Strategy, No Commitment',
    hero_heading_pre: 'Digital Marketing Agency Driven by',
    hero_heading_em: 'Relationships and Results',
    hero_sub: 'Since 2005, Thrive has grown over 8,000 businesses with strategy-first digital marketing. A senior marketing consultant reaches out within 5 minutes to scope your free proposal.',
    hero_trust_list: 'No long-term contracts\n20+ years, 8,000+ businesses grown\nFree strategy proposal\nGoogle Premier Partner',
    hero_team_label: 'Get scheduled with a senior marketing consultant within 5 minutes',
    form_eyebrow: 'Free Proposal · No Commitment',
    form_headline: 'Get Your FREE Digital Marketing Proposal',
    form_sub: 'Tell us about your business. A senior marketing consultant follows up within 5 minutes to scope a free strategy call.',
    form_button: 'GET MY FREE PROPOSAL →',
    form_fineprint: 'We respect your inbox. Used only for your proposal.',
    form_success_heading: 'Got It, Proposal Incoming',
    form_success_text: 'A senior marketing consultant will reach out within 5 minutes to schedule your strategy call. If urgent, call (888) 342-0534.',
  };
  let seed = await api('PATCH', '/items/homepage', content);
  if (!seed.ok) seed = await api('POST', '/items/homepage', content);
  if (!seed.ok) throw new Error('seed homepage: ' + JSON.stringify(seed.json));
  console.log('homepage content seeded (hero)');
  console.log('HOMEPAGE_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
