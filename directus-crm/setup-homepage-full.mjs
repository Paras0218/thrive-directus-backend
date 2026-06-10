// Full homepage CMS-ization: all section text on the homepage singleton +
// repeatable collections for the list sections. Idempotent.
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
  const ex = await api('GET', `/collections/${def.collection}`);
  if (ex.ok) { console.log(`= ${def.collection}`); return; }
  const r = await api('POST', '/collections', def);
  if (!r.ok) throw new Error(`collection ${def.collection}: ` + JSON.stringify(r.json));
  console.log(`+ collection ${def.collection}`);
}
async function ensureField(c, def) {
  const ex = await api('GET', `/fields/${c}/${def.field}`);
  if (ex.ok) return;
  const r = await api('POST', `/fields/${c}`, def);
  if (!r.ok) throw new Error(`field ${c}.${def.field}: ` + JSON.stringify(r.json));
}
const PK = { field: 'id', type: 'integer', meta: { hidden: true, interface: 'input', readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } };
const str = (field, width = 'full') => ({ field, type: 'string', meta: { interface: 'input', width }, schema: {} });
const txt = (field, note) => ({ field, type: 'text', meta: { interface: 'input-multiline', width: 'full', ...(note ? { note } : {}) }, schema: {} });
const statusField = { field: 'status', type: 'string', schema: { default_value: 'published' }, meta: { interface: 'select-dropdown', width: 'half', display: 'labels', options: { choices: [{ text: 'Published', value: 'published' }, { text: 'Draft', value: 'draft' }] } } };
const sortField = { field: 'sort', type: 'integer', meta: { interface: 'input', hidden: true }, schema: {} };

async function reseed(collection, rows) {
  const ex = await api('GET', `/items/${collection}?fields=id&limit=-1`);
  const ids = ex.ok && Array.isArray(ex.json.data) ? ex.json.data.map((r) => r.id) : [];
  if (ids.length) await api('DELETE', `/items/${collection}`, ids);
  let sort = 1;
  for (const row of rows) {
    const r = await api('POST', `/items/${collection}`, { status: 'published', sort: sort++, ...row });
    if (!r.ok) throw new Error(`seed ${collection}: ` + JSON.stringify(r.json));
  }
  console.log(`seeded ${rows.length} ${collection}`);
}

async function main() {
  // ---- homepage singleton: new text fields ----
  const fields = [
    str('ts_google_num', 'half'), str('ts_clutch_num', 'half'), str('ts_reviews_text'), str('ts_reviews_url'),
    str('awards_eyebrow'),
    str('results_h2'), str('results_sub'), str('results_cta_text', 'half'), str('results_cta_url', 'half'),
    str('wins_h2'), str('wins_sub'),
    str('inc_headline'), txt('inc_body_html', 'HTML allowed'), str('inc_cta_text', 'half'), str('inc_cta_url', 'half'),
    str('voices_h2'), txt('voices_body_html', 'HTML allowed'), str('voices_cta_text', 'half'), str('voices_cta_url', 'half'),
    str('aiv_h2_pre'), str('aiv_h2_em'), str('aiv_sub'), txt('aiv_body_html', 'HTML allowed'), str('aiv_cta_text', 'half'), str('aiv_cta_url', 'half'),
    str('aiv_stat1_num', 'half'), str('aiv_stat1_lab', 'half'), str('aiv_stat2_num', 'half'), str('aiv_stat2_lab', 'half'), str('aiv_stat3_num', 'half'), str('aiv_stat3_lab', 'half'),
    str('grow_h2'), txt('grow_body_html', 'HTML allowed'),
    str('rankings_h2'), str('rankings_sub'), str('rk_pill1', 'half'), str('rk_pill2', 'half'), str('rk_pill3', 'half'),
    str('why_eyebrow'), str('why_h2'), txt('why_body_html', 'HTML allowed'), str('why_team_h3'), str('why_cta_text', 'half'), str('why_cta_url', 'half'),
    str('closing_h2'), txt('closing_text'), str('closing_cta1_text', 'half'), str('closing_cta2_text', 'half'),
    str('footer_h2_pre', 'half'), str('footer_h2_em', 'half'), txt('footer_desc_html', 'HTML allowed'), str('footer_cta_h3', 'half'), str('footer_cta_text'),
  ];
  for (const f of fields) await ensureField('homepage', f);
  console.log('homepage fields ensured');

  const content = {
    ts_google_num: '150+', ts_clutch_num: '100+', ts_reviews_text: 'Over 1,000 Client Reviews', ts_reviews_url: 'https://thriveagency.com/real-reviews-from-real-people/',
    awards_eyebrow: 'Recognized By',
    results_h2: 'Our Clients Get Results',
    results_sub: 'Here are two recent wins, both built on the same proven playbook of strategy, execution and honest reporting.',
    results_cta_text: 'SEE MORE CASE STUDIES', results_cta_url: 'https://thriveagency.com/case-studies/',
    wins_h2: 'More Results Across Industries',
    wins_sub: 'The same strategy-first playbook compounds across every vertical we touch.',
    inc_headline: 'How Thrive Grew Its Sales Qualified Leads by 1,258% in 5 Years',
    inc_body_html: `<p>We grew our own sales-qualified leads 1,258% by testing strategies internally first, then applying only the methods that proved out. <strong>We don't make promises, we show you real results.</strong></p>\n<p>By testing strategies internally and taking lessons learned, we've established proven methods for predictable results across a range of industries, business types and target audiences.</p>\n<p>We've experienced our own story of transformation, and you can trust us to implement the right strategies to make your company grow.</p>\n<p>Thrive has consistently ranked on the <a class="inc-link" href="https://thriveagency.com/news/thrive-named-to-inc-5000-list-of-fastest-growing-companies-in-america-for-7th-consecutive-year/" target="_blank" rel="noopener">Inc. 5000 list of the fastest-growing companies in the U.S.</a></p>\n<p><strong>In a span of 5 years, Thrive grew its sales qualified leads by 1,258% and its organic website traffic by 1,750%.</strong></p>`,
    inc_cta_text: "LET'S GROW YOUR BUSINESS NOW", inc_cta_url: '#contactForm',
    voices_h2: 'A Strategy-First Marketing Partner Since 2005',
    voices_body_html: `<p>Thrive Internet Marketing Agency has been an <strong>industry-leading digital marketing service provider</strong> since 2005, delivering results-driven work across SEO, PPC, web design and paid social. We've <strong>helped thousands of businesses grow</strong> by pairing a senior in-house team with a <strong>strategy-first approach</strong> and <strong>proprietary technology and tools</strong> that report on what's working in real time.</p>\n<p>We work with clients of all sizes, from startups to multi-location enterprises across the U.S., Canada, UK and dozens of other markets. Pricing scales with your budget. Every engagement runs on <strong>month-to-month contracts</strong>, so we have to earn the partnership every month.</p>`,
    voices_cta_text: 'GET MY FREE PROPOSAL', voices_cta_url: '#contactForm',
    aiv_h2_pre: 'The Best AI SEO Agency for', aiv_h2_em: 'AI Visibility',
    aiv_sub: 'Helping Businesses Dominate Large Language Model AI Search',
    aiv_body_html: `<p>Rapid advances in generative artificial intelligence (AI) models have reshaped how content is discovered and consumed. Traditional search engine optimization (SEO) is no longer enough to reach those looking for your products or services. To stay visible online amid shifting algorithms, you need to optimize for AI-first discovery.</p>\n<p>Thrive is one of the <a href="https://thriveagency.com/thriveai/" target="_blank" rel="noopener">top generative engine optimization companies</a> for AI visibility. Using our internal research and development (R&amp;D) department, we've been testing and perfecting AI SEO strategies for large language models (LLMs) while other agencies experiment with your budget.</p>`,
    aiv_cta_text: 'BUILD MY AI SEO STRATEGY', aiv_cta_url: '#contactForm',
    aiv_stat1_num: '+5,556%', aiv_stat1_lab: 'AI Referral Traffic (2025)',
    aiv_stat2_num: '+404%', aiv_stat2_lab: 'Gemini Traffic (2025)',
    aiv_stat3_num: '+1,078%', aiv_stat3_lab: 'ChatGPT Search Traffic (2025)',
    grow_h2: 'How We Grow Your Revenue',
    grow_body_html: `<p>Thrive stands apart from the more than 100,000 marketing companies with its <strong>proprietary technology</strong> that gives you complete visibility into your performance across channels.</p>\n<p>Our unrivaled tools give clients a unique advantage by turning raw data into clear, actionable insights. Combined with our <strong>proven, strategy-first approach,</strong> these tools maximize budget efficiency and drive measurable, meaningful results.</p>`,
    rankings_h2: 'Top Rankings Wherever Your Customers Search',
    rankings_sub: 'Our clients appear when buyers go looking, from traditional search and Google Maps to AI assistants.',
    rk_pill1: '#1 in Google Search', rk_pill2: '#1 in Google Maps Search', rk_pill3: '#1 in ChatGPT Search',
    why_eyebrow: 'Why Thrive', why_h2: 'Why Choose Thrive as Your Digital Marketing Agency',
    why_body_html: `<p>We've provided comprehensive website marketing services to clients across industries since 2005. Our digital marketing services include a combination of conversion and management, with services like SEO, PPC, paid social, web design and development, eCommerce optimization, copywriting, conversion rate optimization (CRO) and more.</p>\n<p>You work with a U.S.-based team of 160+ marketing specialists who answer the phone, share the same data you do and report transparently every month. Strategy, execution and reporting all live under one roof.</p>`,
    why_team_h3: 'What You Get When You Work with Us',
    why_cta_text: 'SPEAK WITH AN INTERNET MARKETING CONSULTANT', why_cta_url: '#contactForm',
    closing_h2: 'Ready to Grow Your Business?',
    closing_text: "If you're looking for the best marketing agency that delivers real results, not just clicks and impressions, you're in the right place. Contact us today to work with a results-driven digital marketing agency.",
    closing_cta1_text: 'GET FREE PROPOSAL', closing_cta2_text: 'CALL 888.342.0534',
    footer_h2_pre: 'Ready to', footer_h2_em: 'Grow',
    footer_desc_html: `Thrive Internet Marketing Agency is a full-service digital marketing agency. Thrive offers <strong>affordable pricing</strong> for any size business, boasts a <strong>95% client retention rate</strong> and made the <strong>Inc. 5000 list</strong> of fastest-growing U.S. companies <strong>seven consecutive years</strong>.`,
    footer_cta_h3: 'Get Started', footer_cta_text: 'Ready to speak with a marketing expert? Get a free proposal today.',
  };
  let seed = await api('PATCH', '/items/homepage', content);
  if (!seed.ok) throw new Error('patch homepage: ' + JSON.stringify(seed.json));
  console.log('homepage content patched');

  // ---- home_results ----
  await ensureCollection({ collection: 'home_results', meta: { icon: 'movie', note: 'Client result video cards', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('video_url'), str('video_id', 'half'), txt('quote'), str('attrib', 'half'), str('stat1_num', 'half'), str('stat1_lab', 'half'), str('stat2_num', 'half'), str('stat2_lab', 'half'), str('stat3_num', 'half'), str('stat3_lab', 'half'), str('link_text'), str('link_url')]) await ensureField('home_results', f);
  await reseed('home_results', [
    { video_url: 'https://www.youtube.com/watch?v=45Rs4sgWBL8', video_id: '45Rs4sgWBL8', quote: '"Since we started working with Thrive, our SEO return on investment is in the 800% range."', attrib: 'Owner, Qualis Roofing', stat1_num: '+7,725', stat1_lab: 'Organic Sessions', stat2_num: '+2,000', stat2_lab: 'Organic Conversions', stat3_num: '+25%', stat3_lab: 'Conversion Rate', link_text: 'Read the Qualis case study →', link_url: 'https://thriveagency.com/case-study/qualis/' },
    { video_url: 'https://www.youtube.com/watch?v=3Kl8eMtstBs', video_id: '3Kl8eMtstBs', quote: '"Thrive is handling business the way they said they would in the beginning."', attrib: 'Owner, TruckAC+', stat1_num: '23X', stat1_lab: 'Return on Ad Spend', stat2_num: '+$350K', stat2_lab: 'Ad Revenue', stat3_num: '+1,092', stat3_lab: 'Website Purchases', link_text: 'Read the TruckAC+ case study →', link_url: 'https://thriveagency.com/case-study/truckac/' },
  ]);

  // ---- home_wins ----  (stats stored as "NUM|TEXT")
  await ensureCollection({ collection: 'home_wins', meta: { icon: 'workspace_premium', note: 'Client win cards', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('pill', 'half'), str('logo'), str('hero_num', 'half'), str('hero_lab', 'half'), str('stat1', 'half'), str('stat2', 'half'), str('services'), str('link_text'), str('link_url')]) await ensureField('home_wins', f);
  await reseed('home_wins', [
    { pill: 'Higher Education', logo: '/assets/home/client-brazos.webp', hero_num: '+300%', hero_lab: 'Avg Monthly Visits', stat1: '+40%|total loan volume', stat2: '+156%|ad conversions', services: 'Web design, SEO, PPC, content, social and email', link_text: 'Read the Brazos case study →', link_url: 'https://thriveagency.com/case-study/brazos-higher-education/' },
    { pill: 'Health Insurance', logo: '/assets/home/client-ushealth.webp', hero_num: '10X', hero_lab: 'Annual Revenue Growth', stat1: '+$2M|annual revenue', stat2: '+558%|organic conversions', services: 'PPC, SEO, web design and organic social', link_text: 'Read the USHealth case study →', link_url: 'https://thriveagency.com/case-study/u-s-based-health-insurance-provider/' },
    { pill: 'HVAC', logo: '/assets/client-max-mechanical.webp', hero_num: '+763%', hero_lab: 'Qualified Leads', stat1: '+349|top-5 keyword rankings', stat2: '-15.97%|bounce rate', services: 'Web design, SEO and PPC', link_text: 'Read the Max Mechanical case study →', link_url: 'https://thriveagency.com/case-study/max-mechanical/' },
    { pill: 'Property Restoration', logo: '/assets/client-restoration-1.webp', hero_num: '+452%', hero_lab: 'Conversions', stat1: '+30%|engaged sessions', stat2: '-41%|bounce rate', services: 'SEO, web design, PPC and reputation management', link_text: 'Read the Restoration 1 case study →', link_url: 'https://thriveagency.com/case-study/restoration-1/' },
    { pill: 'Painting', logo: '/assets/spray-tex-logo.png', hero_num: '+332%', hero_lab: 'Ad Conversion Value', stat1: '+3,800%|branded campaign performance', stat2: '+60%|click-through rate', services: 'PPC', link_text: 'Read the Spray Tex case study →', link_url: 'https://thriveagency.com/case-study/interior-and-exterior-painting-company/' },
    { pill: 'Early Childhood Education', logo: '/assets/home/client-cadence.webp', hero_num: '+223%', hero_lab: 'Google Ads Conversions', stat1: '+10.4K|paid search conversions', stat2: '+15M|paid social impressions', services: 'Google Ads and Meta Ads', link_text: 'Read the Cadence case study →', link_url: 'https://thriveagency.com/case-study/early-childhood-education-franchise/' },
  ]);

  // ---- home_aiv ----
  await ensureCollection({ collection: 'home_aiv', meta: { icon: 'smart_toy', note: 'AI visibility service cards', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('title'), str('url'), txt('body')]) await ensureField('home_aiv', f);
  await reseed('home_aiv', [
    { title: 'AI Mode Visibility', url: 'https://thriveagency.com/thriveai/', body: "Google AI Mode redefines how customers discover businesses, prioritizing zero-click answers over traditional search results. Thrive's AI SEO experts optimize your content for passage-level targeting and conversational queries to build topical authority that AI recognizes." },
    { title: 'AI Overviews Visibility', url: 'https://thriveagency.com/thriveai/', body: "Get cited as a trusted source in Google AI Overviews and drive traffic even when users don't click through traditional results. Our LLM SEO approach structures content to answer layered user queries, earning authentic reviews and boosting your online presence." },
    { title: 'ChatGPT Search Optimization', url: 'https://thriveagency.com/thriveai/', body: 'Our ChatGPT SEO strategies leverage digital PR to build external brand mentions and create high-quality, digestible content that appears in the forums and authoritative sources the LLM pulls from.' },
    { title: 'Gemini Search Optimization', url: 'https://thriveagency.com/thriveai/', body: "Optimize your content for Google's Gemini AI, the source behind AI Overviews and AI Mode. Our AI SEO experts create content using semantic comprehension and natural language that Gemini can easily interpret." },
  ]);

  // ---- home_tools ----
  await ensureCollection({ collection: 'home_tools', meta: { icon: 'build', note: 'How We Grow Your Revenue — tool cards', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('logo'), str('heading'), txt('body_html', 'HTML allowed'), str('learn_url'), str('visual')]) await ensureField('home_tools', f);
  await reseed('home_tools', [
    { logo: '/assets/tools/thrive-score-logo.png', heading: '', body_html: `The Thrive Score is a comprehensive evaluation process designed to assess our client's digital marketing efforts. We utilize a scoring matrix with <strong>over 150 factors</strong> that gauge the effectiveness of the client's current approach, providing insights into their strengths and highlighting opportunities for improvement.`, learn_url: 'https://thriveagency.com/digital-marketing-services/thrive-score/', visual: '/assets/tools/thrive-score-graphic.png' },
    { logo: '/assets/tools/thrive-stats-logo.png', heading: '', body_html: `Gain visibility into your online performance with Thrive Stats, our proprietary reporting solution. Beyond tracking performance metrics, it transforms complex marketing data into actionable intelligence. Thrive Stats helps you understand your campaign status, why it matters and how we're optimizing for your success.`, learn_url: 'https://thriveagency.com/digital-marketing-services/thrive-stats/', visual: '/assets/tools/thrive-stats-screen-new.png' },
    { logo: '/assets/tools/thrive-ai-logo.png', heading: '', body_html: `Before businesses caught on to AI search, Thrive had been testing and optimizing it for months. That experience powers ThriveAI, a suite of tools built to put your brand ahead of the curve. ThriveAI helps your business be recommended in AI search results in ChatGPT, Gemini, Google AI Overviews, AI Mode and several others. Through human expertise and AI insights, Thrive helps you earn visibility, build authority, improve sentiment and reach high-intent audiences.`, learn_url: 'https://thriveagency.com/thriveai/', visual: '/assets/tools/thrive-ai-brands-new.png' },
    { logo: '/assets/tools/thrive-growth-formula-logo.png', heading: '', body_html: `We don't believe in wasted marketing spend. We take a <strong>strategy-first approach</strong> and follow our five-step GROWTH formula to optimize your customer journey and increase your conversion rate. Our team optimizes every touchpoint to consistently deliver better results.`, learn_url: 'https://thriveagency.com/thrive-growth-formula/', visual: '/assets/tools/thrive-growth-formula.gif' },
    { logo: '/assets/tools/thrive-local-logo.png', heading: 'Pay-for-Performance Software and Service Solutions for Local Businesses', body_html: `<p>Generate 5-star online reviews at scale, effortlessly attract leads and drive real growth with our 100% done-for-you online reputation management and lead generation solutions.</p>\n<p>Thrive Local's AI-powered software seamlessly integrates with major platforms to streamline your processes.</p>\n<p>From your local business listings to your online reviews, our team of experts is here to protect and enhance your digital presence for tangible, long-term results.</p>`, learn_url: 'https://thriveagency.com/thrive-local/', visual: '/assets/tools/thrive-local-phone-new.png' },
  ]);

  // ---- home_values ----
  await ensureCollection({ collection: 'home_values', meta: { icon: 'verified', note: 'Why Choose Thrive — value items', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('title'), txt('body')]) await ensureField('home_values', f);
  await reseed('home_values', [
    { title: 'We Have Proven Results', body: 'Our team has driven proven results for businesses across more than 100 industries. We build strategy from real account data, then execute, optimize and report transparently. Every campaign ships with the metrics that map back to revenue, not vanity dashboards.' },
    { title: 'We Are Honest and Ethical', body: "We tell you what's working and what isn't. We don't upsell services you don't need, we don't hide reporting behind paywalls and our pricing is transparent from the first proposal. Our people are full-time Thrive employees in your time zone." },
    { title: 'We Know Digital Marketing', body: '20+ years of digital marketing experience across SEO, PPC, paid social, web design, eCommerce, content, conversion rate optimization and AI search. Google Premier Partner, Meta Business Partner and Microsoft Advertising Partner accreditations.' },
    { title: 'We Put Customers First', body: 'You get a dedicated senior marketing consultant, a strategist and a delivery team. We answer calls and emails the same day, and we treat your budget like our own. Over 1,000 clients have trusted us with their growth since 2005.' },
  ]);

  // ---- testimonials ----
  await ensureCollection({ collection: 'testimonials', meta: { icon: 'format_quote', note: 'Testimonial carousel slides (image + alt)', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('image'), txt('alt')]) await ensureField('testimonials', f);
  await reseed('testimonials', [
    { image: '/assets/Carousel%20Images/Hero_Graphic.png', alt: "Kelly Foster, Partner at Qualis Roofing & Construction: Thrive's approach was different and it was so much more comprehensive. They're able to represent the problem in ways that we hadn't thought of before." },
    { image: '/assets/Carousel%20Images/Hero_Graphic-1.png', alt: "Dustin Norris, Founder and President at Coach Specialists: Thrive came in and has shined for us. It was very streamlined. We didn't have to ask a lot of questions. They were forward thinking." },
    { image: '/assets/Carousel%20Images/Hero_Graphic-2.png', alt: "Katherine, Director of Marketing at Daryl Flood: My experience has been phenomenal. Our website's continuing to grow in rank. The traffic has increased. The quality leads have increased and we are also seeing higher and higher engagement." },
    { image: '/assets/Carousel%20Images/Hero_Graphic-3.png', alt: "Jeff Vosburg, General Manager at Ready Seal: We have had sustained growth ever since we've been with Thrive. They're just very knowledgeable on what they do and they're people of integrity. We're definitely thankful for them, it's a great partnership." },
    { image: '/assets/Carousel%20Images/Hero_Graphic-4.png', alt: 'Eric Armstrong, President and CEO at Quick Roofing: My experience has been totally satisfying. I think that we are gonna create some great things, so I could not be happier.' },
    { image: '/assets/Carousel%20Images/Hero_Graphic-5.png', alt: "Gary Singleton, President and CEO at Max Mechanical: Thrive is passionate, they're sincere, they're honest. They actually do what they say and even go above and beyond. With Thrive, you get more bang for your buck." },
  ]);

  console.log('HOMEPAGE_FULL_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
