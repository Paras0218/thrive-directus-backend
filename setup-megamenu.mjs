// Idempotent setup for the SERVICES mega-menu (flat collection + full Thrive content).
// Flat model (no relations) on purpose — avoids the Directus relation-update crash.
// Re-running RESETS the SERVICES mega-menu to the full set defined below.
//
// Each category heading shows an image (from /assets/menu/services/*.svg) instead of
// a Lucide icon, links to its hub page, and lists the real Thrive service endpoints.
import fs from 'node:fs';

const BASE = 'http://localhost:8055';
const TOKEN = fs.readFileSync('E:/directus-cms/static-token.txt', 'utf8').trim();
const IMG = '/assets/menu/services'; // public folder path served by Astro

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
const int = (field, width = 'half', note) => ({ field, type: 'integer', meta: { interface: 'input', width, ...(note ? { note } : {}) }, schema: {} });

// Full Thrive SERVICES mega-menu — 4 columns.
// image = file in /assets/menu/services ; url = heading hub page ; links = { label, url }.
const COLUMNS = {
  1: [
    {
      category: 'Digital Marketing', image: 'Commercial-image.svg', url: '/digital-marketing-services/',
      links: [
        ['Digital Marketing Strategy Development', '/digital-marketing-services/digital-marketing-strategy-development/'],
        ['Franchise Digital Marketing', '/digital-marketing-services/franchise-digital-marketing/'],
        ['Enterprise Digital Marketing', '/digital-marketing-services/enterprise-digital-marketing/'],
      ],
    },
    {
      category: 'Search Engine Optimization (SEO)', image: 'SEO.svg', url: '/digital-marketing-services/search-engine-optimization-seo/',
      links: [
        ['Local SEO', '/digital-marketing-services/local-seo/'],
        ['Technical SEO', '/digital-marketing-services/technical-seo/'],
        ['AI SEO Services', '/digital-marketing-services/ai-seo-services/'],
        ['Franchise SEO', '/digital-marketing-services/franchise-seo/'],
        ['Enterprise SEO', '/digital-marketing-services/enterprise-seo-services/'],
        ['SEO Audits', '/digital-marketing-services/seo-audit-services/'],
        ['Franchise SEO Audit', '/digital-marketing-services/franchise-seo-audit-services/'],
        ['Enterprise SEO Audit', '/digital-marketing-services/enterprise-seo-audit-services/'],
      ],
    },
    {
      category: 'CRO Services', image: 'Commercial.svg', url: '/digital-marketing-services/conversion-rate-optimization/',
      links: [
        ['CRO Audits', '/digital-marketing-services/cro-audit/'],
        ['User Experience Testing', '/digital-marketing-services/user-experience-testing/'],
        ['User Behavior Analytics', '/digital-marketing-services/user-behavior-analytics/'],
      ],
    },
  ],
  2: [
    {
      category: 'Pay Per Click (PPC) Marketing', image: 'pay-per-click-img.svg', url: '/digital-marketing-services/pay-per-click-ppc/',
      links: [
        ['Search Engine Marketing (SEM)', '/digital-marketing-services/search-engine-marketing/'],
        ['Google Ads Management', '/digital-marketing-services/google-ads-management-services/'],
        ['YouTube Ads Management', '/digital-marketing-services/youtube-advertising-services/'],
        ['Programmatic Advertising', '/digital-marketing-services/programmatic-advertising/'],
        ['Lead Generation Services', '/digital-marketing-services/lead-generation-services/'],
        ['Franchise PPC', '/franchise-ppc-marketing/'],
        ['Enterprise PPC', '/enterprise-ppc-marketing/'],
      ],
    },
    {
      category: 'Social Media Marketing', image: 'social-media-1.svg', url: '/digital-marketing-services/social-media/',
      links: [
        ['Social Media Management', '/digital-marketing-services/social-media-management/'],
        ['Social Media Brand Management', '/digital-marketing-services/social-media/social-media-brand-management/'],
        ['Franchise Social Media', '/digital-marketing-services/franchise-social-media-marketing/'],
        ['Enterprise Social Media', '/digital-marketing-services/enterprise-social-media-marketing/'],
      ],
    },
    {
      category: 'Social Media Advertising', image: 'social-media-adver-img.svg', url: '/digital-marketing-services/social-media/social-media-advertising/',
      links: [
        ['Facebook', '/digital-marketing-services/facebook-advertising/'],
        ['LinkedIn', '/digital-marketing-services/linkedin-advertising/'],
        ['Twitter', '/digital-marketing-services/twitter-advertising/'],
        ['Instagram', '/digital-marketing-services/instagram-marketing-agency/'],
      ],
    },
  ],
  3: [
    {
      category: 'Link Building', image: 'link-building-img.svg', url: '/digital-marketing-services/link-building/',
      links: [
        ['Digital PR Outreach', '/digital-marketing-services/digital-pr-services/'],
        ['HARO Link Building', '/digital-marketing-services/haro-link-building/'],
      ],
    },
    {
      category: 'Web Design & Development', image: 'web-design-img.svg', url: '/digital-marketing-services/web-design/',
      links: [
        ['Branding Services', '/digital-marketing-services/branding-services/'],
        ['Custom Website Design', '/digital-marketing-services/custom-website-design/'],
        ['WordPress Website Design', '/digital-marketing-services/wordpress-website-design/'],
        ['Website Hosting', '/digital-marketing-services/web-design/website-hosting/'],
        ['ADA Compliance Services', '/digital-marketing-services/ada-compliance-services/'],
      ],
    },
    {
      category: 'Media Production', image: 'media-production-img.svg', url: '/digital-marketing-services/media-production-services/',
      links: [
        ['Video Production', '/digital-marketing-services/video-production-services/'],
        ['Video Testimonial Services', '/digital-marketing-services/video-testimonial-services/'],
        ['Product Photography Services', '/digital-marketing-services/product-photography/'],
        ['Drone Video and Photography Services', '/digital-marketing-services/drone-video-and-photography-services/'],
      ],
    },
    {
      category: 'Content Marketing', image: 'link-icon-img.svg', url: '/digital-marketing-services/content-marketing/',
      links: [
        ['SEO Content Writing', '/digital-marketing-services/content-writing/'],
        ['Copywriting Services', '/digital-marketing-services/copywriting-services/'],
        ['Translation Services', '/digital-marketing-services/translation-services/'],
        ['Email Marketing Services', '/digital-marketing-services/email-marketing-services/'],
        ['Outbound Marketing', '/digital-marketing-services/outbound-marketing/'],
      ],
    },
  ],
  4: [
    {
      category: 'eCommerce Marketing', image: 'ecommerce-img.svg', url: '/digital-marketing-services/ecommerce-marketing/',
      links: [
        ['eCommerce SEO', '/digital-marketing-services/ecommerce-seo/'],
        ['eCommerce PPC', '/digital-marketing-services/ecommerce-ppc/'],
        ['eCommerce Optimization', '/digital-marketing-services/ecommerce-optimization/'],
        ['Shopify SEO', '/digital-marketing-services/shopify-seo/'],
        ['Shopify Web Design', '/digital-marketing-services/shopify-web-designers/'],
        ['eCommerce Web Design', '/digital-marketing-services/ecommerce-website-design/'],
      ],
    },
    {
      category: 'Online Marketplace Marketing', image: 'online-marketplace-img.svg', url: '/digital-marketing-services/online-marketplace-marketing/',
      links: [
        ['Amazon Marketing Services', '/digital-marketing-services/amazon-marketing/'],
        ['Amazon SEO', '/digital-marketing-services/amazon-seo-services/'],
        ['Amazon Advertising/PPC', '/digital-marketing-services/amazon-ppc/'],
        ['Amazon Storefront & Branding', '/digital-marketing-services/amazon-storefront-branding-services/'],
        ['Amazon Seller Consulting', '/digital-marketing-services/amazon-seller-consulting/'],
        ['Amazon Posts Management', '/digital-marketing-services/amazon-posts-management/'],
        ['Amazon DSP Advertising Management', '/digital-marketing-services/amazon-dsp-advertising-management/'],
        ['Walmart Marketplace', '/digital-marketing-services/walmart-marketplace/'],
        ['Target Plus Marketplace', '/digital-marketing-services/target-plus-marketplace/'],
      ],
    },
  ],
};

async function main() {
  await ensureCollection({
    collection: 'mega_menu',
    meta: { icon: 'grid_view', note: 'Mega-menu links: which top menu, column, category (+image/icon), and link', sort_field: 'sort' },
    schema: {},
    fields: [PK],
  });
  await ensureField('mega_menu', {
    field: 'status', type: 'string',
    schema: { default_value: 'draft' },
    meta: { interface: 'select-dropdown', width: 'half', display: 'labels', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }] } },
  });
  await ensureField('mega_menu', { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} });
  await ensureField('mega_menu', str('menu', 'half', 'Top nav label this belongs to, e.g. SERVICES'));
  await ensureField('mega_menu', int('column', 'half', 'Column 1-4'));
  await ensureField('mega_menu', str('category', 'half', 'Group heading, e.g. Search Engine Optimization (SEO)'));
  await ensureField('mega_menu', str('icon', 'half', 'Lucide icon name (fallback when image is empty), e.g. search'));
  await ensureField('mega_menu', str('image', 'half', 'Heading image path, e.g. /assets/menu/services/SEO.svg (takes priority over icon)'));
  await ensureField('mega_menu', str('category_url', 'half', 'Link for the category heading / standalone item (leave blank for a plain heading)'));
  await ensureField('mega_menu', str('label', 'half', 'The link text'));
  await ensureField('mega_menu', str('url', 'half'));

  // Reset existing SERVICES rows, then insert the full set
  const existing = await api('GET', '/items/mega_menu?filter[menu][_eq]=SERVICES&fields=id&limit=-1');
  const existingIds = existing.ok && Array.isArray(existing.json.data) ? existing.json.data.map((r) => r.id) : [];
  if (existingIds.length) {
    const del = await api('DELETE', '/items/mega_menu', existingIds);
    if (!del.ok) throw new Error('delete existing: ' + JSON.stringify(del.json));
    console.log(`cleared ${existingIds.length} existing SERVICES rows`);
  }

  let sort = 1;
  let total = 0;
  for (const col of [1, 2, 3, 4]) {
    for (const cat of COLUMNS[col]) {
      for (const [label, url] of cat.links) {
        const r = await api('POST', '/items/mega_menu', {
          status: 'published', sort: sort++, menu: 'SERVICES', column: col,
          category: cat.category, icon: '', image: `${IMG}/${cat.image}`,
          category_url: cat.url, label, url,
        });
        if (!r.ok) throw new Error('seed mega row: ' + JSON.stringify(r.json));
        total++;
      }
    }
  }
  console.log(`seeded ${total} mega-menu links`);
  console.log('MEGAMENU_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
