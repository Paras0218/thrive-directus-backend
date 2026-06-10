// Seed the LOCAL mega-menu (3 link columns) — faithful to the live Thrive site.
// Each heading/standalone item shows an image icon (from /assets/menu/local/*) and
// links to its real Thrive Local endpoint. links:[] => standalone item.
import fs from 'node:fs';

const BASE = 'http://localhost:8055';
const TOKEN = fs.readFileSync('E:/directus-cms/static-token.txt', 'utf8').trim();
const IMG = '/assets/menu/local';

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

async function ensureField(collection, def) {
  const exists = await api('GET', `/fields/${collection}/${def.field}`);
  if (exists.ok) { console.log(`  = ${collection}.${def.field} (exists)`); return; }
  const r = await api('POST', `/fields/${collection}`, def);
  if (!r.ok) throw new Error(`create field ${collection}.${def.field}: ` + JSON.stringify(r.json));
  console.log(`  + ${collection}.${def.field}`);
}

// LOCAL mega-menu (3 link columns). image = file in /assets/menu/local ; url = heading hub ;
// links = [label, url]. links:[] => standalone item (heading itself is the link).
const COLUMNS = {
  1: [
    {
      category: 'Reputation Management', image: 'Reputation-management.svg', url: '/digital-marketing-services/online-reputation-management/',
      links: [
        ['Reputation Management Software', '/digital-marketing-services/reputation-management-software/'],
        ['Reputation Repair', '/digital-marketing-services/online-reputation-repair/'],
        ['Social Media Reputation Management', '/digital-marketing-services/social-media-reputation-management/'],
        ['Franchise Reputation Management', '/digital-marketing-services/franchise-reputation-management/'],
        ['White Label Reputation Management', '/thrive-local/white-label-reputation-management-company/'],
      ],
    },
    { category: 'SMS Marketing', image: 'local-message.svg', url: '/thrive-local/sms-marketing-services/', links: [] },
    { category: "Thrive Local's Growth Acceleration Method", image: 'thrive-growth-icon.svg', url: '/thrive-local/thrive-locals-growth-acceleration-method/', links: [] },
  ],
  2: [
    {
      category: 'Review Generation', image: 'review-generation.svg', url: '/thrive-local/review-generation-services/',
      links: [
        ['Review Monitoring', '/thrive-local/review-monitoring-services/'],
        ['Review Response', '/thrive-local/online-review-response-service/'],
        ['Review Widget', '/thrive-local/review-widget/'],
        ['Review Checker', '/thrive-local/online-review-checker/'],
      ],
    },
    { category: 'Listings Management', image: 'local-listingicon.svg', url: '/thrive-local/listings-management/', links: [] },
    { category: 'Survey Campaign Management', image: 'survey-management-icon.svg', url: '/thrive-local/survey-campaign-management/', links: [] },
  ],
  3: [
    { category: 'Insights Software', image: 'insight-software.svg', url: '/thrive-local/insights-software/', links: [] },
    { category: 'Web Chat', image: 'web-chat.svg', url: '/thrive-local/web-chat/', links: [] },
    { category: 'Referral Software', image: 'Commercial-1.svg', url: '/thrive-local/referrals/', links: [] },
    { category: 'Local SEO', image: 'Local-SEO.svg', url: '/local-seo/', links: [] },
    { category: 'Paid Ads Management', image: 'pam.svg', url: '/thrive-local/paid-ads-management/', links: [] },
    { category: 'Social Media Management Software', image: 'Social-Media-Management-1.svg', url: '/thrive-local/social-media-management/', links: [] },
  ],
};

async function main() {
  // fields used by the menu (idempotent; image/category_url already exist from SERVICES setup)
  await ensureField('mega_menu', { field: 'category_url', type: 'string', meta: { interface: 'input', width: 'half', note: 'Link for the category heading / standalone item' }, schema: {} });
  await ensureField('mega_menu', { field: 'image', type: 'string', meta: { interface: 'input', width: 'half', note: 'Heading image path (takes priority over icon)' }, schema: {} });

  // reset existing LOCAL rows
  const existing = await api('GET', '/items/mega_menu?filter[menu][_eq]=LOCAL&fields=id&limit=-1');
  const existingIds = existing.ok && Array.isArray(existing.json.data) ? existing.json.data.map((r) => r.id) : [];
  if (existingIds.length) {
    const del = await api('DELETE', '/items/mega_menu', existingIds);
    if (!del.ok) throw new Error('delete existing LOCAL: ' + JSON.stringify(del.json));
    console.log(`cleared ${existingIds.length} existing LOCAL rows`);
  }

  let sort = 1;
  let total = 0;
  for (const col of [1, 2, 3]) {
    for (const cat of COLUMNS[col]) {
      const base = { status: 'published', menu: 'LOCAL', column: col, category: cat.category, icon: '', image: `${IMG}/${cat.image}`, category_url: cat.url };
      if (cat.links.length > 0) {
        for (const [label, url] of cat.links) {
          const r = await api('POST', '/items/mega_menu', { ...base, sort: sort++, label, url });
          if (!r.ok) throw new Error('seed LOCAL row: ' + JSON.stringify(r.json));
          total++;
        }
      } else {
        // standalone: single header-only row (empty label; heading is the link via category_url)
        const r = await api('POST', '/items/mega_menu', { ...base, sort: sort++, label: '', url: '' });
        if (!r.ok) throw new Error('seed LOCAL standalone: ' + JSON.stringify(r.json));
        total++;
      }
    }
  }
  console.log(`seeded ${total} LOCAL mega rows`);
  console.log('LOCAL_MEGAMENU_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
