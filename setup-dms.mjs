// Idempotent setup for the CMS-editable "Digital Marketing Services" page.
// Singleton `dms` (section text) + repeatable collections (cases, testimonials,
// tools, services, reasons, faqs). Re-run with `node setup-dms.mjs` to recreate/reseed.
import fs from 'node:fs';

const BASE = 'http://localhost:8055';
const TOKEN = fs.readFileSync('E:/directus-cms/static-token.txt', 'utf8').trim();
const DMS = '/assets/dms';
const SVC = '/assets/menu/services';

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text(); let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  return { ok: res.ok, status: res.status, json };
}
async function ensureCollection(def) {
  const ex = await api('GET', `/collections/${def.collection}`);
  if (ex.ok) { console.log(`= ${def.collection}`); return; }
  const r = await api('POST', '/collections', def);
  if (!r.ok) throw new Error(`collection ${def.collection}: ` + JSON.stringify(r.json));
  console.log(`+ ${def.collection}`);
}
async function ensureField(c, def) {
  const ex = await api('GET', `/fields/${c}/${def.field}`);
  if (ex.ok) return;
  const r = await api('POST', `/fields/${c}`, def);
  if (!r.ok) throw new Error(`field ${c}.${def.field}: ` + JSON.stringify(r.json));
}
const PK = { field: 'id', type: 'integer', meta: { hidden: true, readonly: true }, schema: { is_primary_key: true, has_auto_increment: true } };
const str = (field, w = 'full') => ({ field, type: 'string', meta: { interface: 'input', width: w }, schema: {} });
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
  console.log(`  seeded ${rows.length} ${collection}`);
}

async function main() {
  // ---------- singleton ----------
  await ensureCollection({ collection: 'dms', meta: { icon: 'campaign', singleton: true, note: 'Digital Marketing Services page content' }, schema: {}, fields: [PK] });
  const F = [
    str('seo_title'), txt('seo_description'),
    str('hero_h1'), str('hero_sub'), str('hero_form_button', 'half'),
    str('intro_h2'), txt('intro_body', 'One paragraph per blank line'), str('intro_video_image'), str('intro_cta_text', 'half'), str('intro_cta_url', 'half'),
    str('reviews_g_num', 'half'), str('reviews_g_label', 'half'), str('reviews_c_num', 'half'), str('reviews_c_label', 'half'), str('reviews_note'),
    str('impact_h2'), str('impact_sub'), txt('impact_body'), str('impact_cta_text', 'half'), str('impact_cta_url', 'half'),
    str('how_h2'), str('how_sub'), txt('how_body'), txt('how_list', 'One bullet per line'), txt('how_body2'),
    str('how_rank1', 'half'), str('how_rank2', 'half'), str('how_rank3', 'half'), str('how_image'),
    str('testi_h3'), str('testi_sub'), str('testi_cta_text', 'half'), str('testi_cta_url', 'half'),
    str('tools_h2'), str('tools_sub'), txt('tools_body'),
    str('services_h2'), str('services_sub'), str('services_cta_text', 'half'), str('services_cta_url', 'half'), str('services_cta2_text', 'half'), str('services_cta2_url', 'half'),
    str('whyuse_h2'), str('whyuse_sub'), txt('whyuse_body'), txt('whyuse_list', 'One bullet per line'), txt('whyuse_body2'), str('whyuse_cta_text', 'half'), str('whyuse_cta_url', 'half'),
    str('whychoose_h2'), str('whychoose_sub'), txt('whychoose_body'), str('whychoose_cta_text', 'half'), str('whychoose_cta_url', 'half'),
    str('faqs_h2'),
    str('cta_h2'), txt('cta_text'), str('cta_btn1_text', 'half'), str('cta_btn1_url', 'half'), str('cta_btn2_text', 'half'),
  ];
  for (const f of F) await ensureField('dms', f);

  const content = {
    seo_title: 'Digital Marketing Services | Thrive',
    seo_description: 'Grow your client base with Thrive’s data-driven, full-service digital marketing services — SEO, PPC, social, web design and more. Free proposal.',
    hero_h1: 'Digital Marketing Services',
    hero_sub: 'Grow Your Client Base With Data-Driven and Targeted Strategies',
    hero_form_button: 'GET MY FREE PROPOSAL',
    intro_h2: 'A Strategy-First Digital Marketing Agency to Grow Your Business',
    intro_body: 'Our results-driven digital marketing company maps your fastest path to growth by providing you with a custom strategy. We start with a deep audit to help us build a channel-by-channel plan to increase your qualified leads and revenue.\n\nThrive Internet Marketing Agency is a versatile and full-service digital marketing agency that doesn’t rely on smoke and mirrors to attract new clients. Instead, we use our deep search engine optimization (SEO) expertise and artificial intelligence (AI)-driven strategies to help businesses achieve long-term, sustainable growth.\n\nInvest in our affordable digital marketing services and get maximum return on your investment.',
    intro_video_image: `${DMS}/turningcomplex-thumb.png`,
    intro_cta_text: 'GROW MY BUSINESS NOW', intro_cta_url: '#contactForm',
    reviews_g_num: '150+', reviews_g_label: 'Google Reviews', reviews_c_num: '100+', reviews_c_label: 'Clutch Reviews', reviews_note: 'Over 1,000 Client Reviews',
    impact_h2: 'The Thrive Impact: Measurable Wins Across Industries',
    impact_sub: 'We Don’t Just Execute, We Deliver Real Results',
    impact_body: 'Many internet marketing content agencies rely on a one-size-fits-all approach, often offering the same strategy and cookie-cutter website as your competitor.\n\nThrive is not a static company. We have the experience and team of professionals to build a custom website and launch multiple digital marketing services to assist businesses of any size and industry.',
    impact_cta_text: 'READ MORE CASE STUDIES', impact_cta_url: '/case-studies/',
    how_h2: 'How Internet Marketing Services Drive Business Growth',
    how_sub: 'Engage Your Target Customers at the Right Time on the Right Platform',
    how_body: 'As long as your business maintains a strong digital presence, your customers will always find you. Affordable digital marketing services provide businesses of all sizes with an opportunity to:',
    how_list: 'Market their brand 24/7 at a low cost.\nExpand market reach while maintaining a robust relationship with existing clients.\nAttract targeted audience segments, irrespective of time differences or specific locations.',
    how_body2: 'Unlike other providers of internet marketing services that overpromise but fail to execute, Thrive earns your business day after day with measurable results. Partner with our internet marketing agency and drive more leads and conversions.',
    how_rank1: '#1 in Google Search', how_rank2: '#1 in Google Maps Search', how_rank3: '#1 in ChatGPT Search',
    how_image: `${DMS}/buisness-growth.jpg`,
    testi_h3: 'What Our Clients Say About Working With Thrive', testi_sub: 'Real Feedback. Real Growth.',
    testi_cta_text: 'HEAR MORE FROM OUR CLIENTS', testi_cta_url: '/real-reviews-from-real-people/',
    tools_h2: 'Thrive’s Proprietary Tools for High-Converting Internet Marketing Services',
    tools_sub: 'Maximize Results With Data-Driven Precision and Automation',
    tools_body: 'At Thrive, we go beyond traditional digital marketing strategies. Our custom-built tools simplify complex digital marketing services, empowering you to make faster, smarter decisions.',
    services_h2: 'Thrive’s Digital Marketing Services',
    services_sub: 'Build Brand Recognition as an Industry Leader and Increase Profitability',
    services_cta_text: 'GET STARTED NOW', services_cta_url: '#contactForm', services_cta2_text: 'GROW MY LEADS NOW', services_cta2_url: '#contactForm',
    whyuse_h2: 'Why Your Business Should Be Using Digital Marketing Services',
    whyuse_sub: 'Engage More Clients and Rank High on Search Results',
    whyuse_body: 'The industry is growing at an unprecedented rate. With more companies investing their time and resources in online marketing, relying on traditional advertising tactics is no longer enough to win over customers.\n\nA trusted internet marketing company can help you gain a holistic view of your customer journey and competition. Through comprehensive digital audits and targeted online marketing campaigns, you can uncover new growth opportunities and create customer experiences that inspire loyalty and long-term success.\n\nBuild a robust digital foundation with value-driven internet marketing services. Expert digital marketing tactics help you:',
    whyuse_list: 'Save time, money and resources\nAcquire huge ROI\nTrack online marketing campaign results\nAdjust digital marketing campaign strategies based on analytics and data\nLeverage precise audience targeting\nBuild stellar brand reputation across online channels\nMaximize various customer touchpoints\nPromote greater consumer engagement\nDrive profitable long-term growth\nImprove conversion rates',
    whyuse_body2: 'Don’t waste your investment in digital campaigns and marketing techniques that do not deliver measurable results. Partner with our online advertising company today and establish your market dominance.',
    whyuse_cta_text: 'BUILD MY DIGITAL SUCCESS', whyuse_cta_url: '#contactForm',
    whychoose_h2: 'Why Choose Thrive As Your Digital Marketing Agency',
    whychoose_sub: 'Boost Your Revenue Growth Rate and Achieve Online Success',
    whychoose_body: 'Thrive is an award-winning internet marketing company that provides goal-oriented website marketing services and advertising solutions. Our primary focus is to help businesses increase their client retention rate and maximize conversion opportunities.\n\nTrust us to give our full commitment to your brand’s digital success. Choose our inbound marketing services and gain the following advantages (and so much more):',
    whychoose_cta_text: 'BUILD MY DIGITAL SUCCESS', whychoose_cta_url: '#contactForm',
    faqs_h2: 'Digital Marketing Services FAQs',
    cta_h2: 'Ready to Grow Your Business?',
    cta_text: 'If you’re looking for the best marketing agency that delivers real results, not just clicks and impressions, you’re in the right place. Contact us today to work with a results-driven digital marketing agency.',
    cta_btn1_text: 'GET FREE PROPOSAL', cta_btn1_url: '#contactForm', cta_btn2_text: 'CALL 888.342.0534',
  };
  let s = await api('PATCH', '/items/dms', content);
  if (!s.ok) s = await api('POST', '/items/dms', content);
  if (!s.ok) throw new Error('seed dms: ' + JSON.stringify(s.json));
  console.log('dms singleton seeded');

  // ---------- case studies ----------
  await ensureCollection({ collection: 'dms_cases', meta: { icon: 'trending_up', note: 'DMS — case study results', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('name'), str('stat1_num', 'half'), str('stat1_label', 'half'), str('stat2_num', 'half'), str('stat2_label', 'half'), txt('description'), str('image'), str('url')]) await ensureField('dms_cases', f);
  await reseed('dms_cases', [
    { name: 'Georgia Bone & Joint', stat1_num: '+557%', stat1_label: 'Monthly Leads', stat2_num: '+212%', stat2_label: 'Ad Conversions', image: `${DMS}/georgia-bonecse.png`, url: '/case-studies/', description: 'This multi-location orthopedic practice group partnered with our digital marketing agency to drive more qualified leads through SEO and paid advertising. Within 12 months of the partnership, Georgia Bone & Joint achieved a historical 20% conversion rate, averaging 75 new patients per month.' },
    { name: 'Image 3D', stat1_num: '+350%', stat1_label: 'Sales Volume', stat2_num: '+451%', stat2_label: 'Unit Sales', image: `${DMS}/IMAGE-3D-cover.png`, url: '/case-studies/', description: 'Image 3D, a retro toy manufacturing company in the U.S., sought to boost its monthly sales and overall digital presence. After two months into the Amazon marketing strategy, Image 3D experienced a staggering 350% increase in sales volume and a 182% year-over-year increase in total purchases.' },
    { name: 'Brazos Higher Education', stat1_num: '+300%', stat1_label: 'Average Monthly Website Visits', stat2_num: '+40%', stat2_label: 'Total Loan Volume', image: `${DMS}/brazothumb.png`, url: '/case-studies/', description: 'Brazos Higher Education needed a comprehensive digital marketing strategy to expand its student loan portfolio. Thrive fully reinvented Brazos’ entire online marketing campaign approach, resulting in a record-high 40% uptick in one-year loan volume and a 300% increase in monthly site visits.' },
  ]);

  // ---------- testimonials ----------
  await ensureCollection({ collection: 'dms_testimonials', meta: { icon: 'format_quote', note: 'DMS — client testimonials', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('headline'), txt('quote'), str('author')]) await ensureField('dms_testimonials', f);
  await reseed('dms_testimonials', [
    { headline: 'A very important part of our success.', author: 'eCommerce Business', quote: 'Unlike other agencies, Thrive’s specialists have always been actively engaged and there is never radio silence from them. It’s like they have been an extension of our team, and we could always rely on them for insight and questions that we have. Thrive has been a very important part of our success. They’re going to be a very important part of your team and definitely a long-term partner. I highly recommend Thrive.' },
    { headline: 'Thrive knows how to manage their time and get the most efficient results.', author: 'Restoration 1', quote: 'Their ability to bring innovative ideas to use, they think outside of the box and they are always planning ahead. They fit their talent perfectly with our account. You guys got us 46,000 qualified calls and that was huge. Our previous agency would only get about 10,000 qualified calls in a year. You have to be able to be very flexible and agile for these franchise owners, and Thrive has done that well.' },
    { headline: 'Remarkable ability to deliver tangible results.', author: 'Holyland Marketplace', quote: 'What sets Thrive Agency and Marizanne apart is their remarkable ability to deliver tangible results. Their strategies have significantly boosted our online presence, engagement, and conversion rates. If you’re searching for a social media agency that combines industry expertise, high-quality service, and a proven track record of delivering results, Thrive is your answer.' },
  ]);

  // ---------- proprietary tools ----------
  await ensureCollection({ collection: 'dms_tools', meta: { icon: 'build', note: 'DMS — proprietary tools', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('title'), txt('description'), str('image')]) await ensureField('dms_tools', f);
  await reseed('dms_tools', [
    { title: 'Thrive Score', image: `${DMS}/thrive-scorenewimg.svg`, description: 'Thrive Score is a marketing diagnostic tool that evaluates over 150 factors to provide a clear snapshot of your business’s current standing. This tool allows our digital marketing company to track progress and refine strategies for improved conversion rates.' },
    { title: 'Thrive Stats', image: `${DMS}/thrive-statnew.svg`, description: 'Easily monitor your online marketing service performance across channels from one dashboard. Thrive Stats transforms complex numbers into easy-to-understand visuals and actionable insights so you know exactly what’s happening on your campaigns.' },
    { title: 'ThriveAI', image: `${DMS}/ThriveAI-thumb.svg`, description: 'ThriveAI is a suite of artificial intelligence (AI)-powered tools designed to ensure your brand’s visibility on AI search. From tracking brand mentions on AI-generated responses to automating manual tasks, ThriveAI streamlines workflows and ensures your business stays top of mind.' },
    { title: 'Thrive Local', image: '/assets/menu/local/thrive-growth-icon.svg', description: 'Thrive Local is a pay-for-performance tool that makes it easier than ever to ensure consistent branding and optimized visibility across local markets. This AI-powered software automates reputation management and local marketing, enabling you to focus on business growth.' },
  ]);

  // ---------- services grid ----------
  await ensureCollection({ collection: 'dms_services', meta: { icon: 'grid_view', note: 'DMS — services grid', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('title'), txt('description'), str('image'), str('url')]) await ensureField('dms_services', f);
  const svc = (title, icon, url, description) => ({ title, image: `${SVC}/${icon}`, url, description });
  await reseed('dms_services', [
    svc('Search Engine Optimization (SEO)', 'SEO.svg', '/digital-marketing-services/search-engine-optimization-seo/', 'Our internet marketing company goes beyond surface-level SEO. We combine AI-powered automation with white hat SEO practices to help you achieve higher organic rankings and ensure your brand remains visible in AI search results.'),
    svc('Franchise SEO', 'SEO.svg', '/digital-marketing-services/franchise-seo/', 'Amplify market reach and improve your AI visibility with Thrive’s franchise SEO services. Our team leverages AI-driven insights to ensure both your corporate site and individual franchise pages rank prominently in organic search and AI responses.'),
    svc('Local SEO', 'SEO.svg', '/digital-marketing-services/local-seo/', 'Generate more leads and sales with Thrive’s hyperlocal digital marketing services. Our internet marketing company uses automation to reduce manual efforts while maintaining human oversight to implement proven strategies that boost local visibility.'),
    svc('Technical SEO', 'SEO.svg', '/digital-marketing-services/technical-seo/', 'Establish a strong online foundation with on-point technical SEO and internet marketing services. Our technical SEO experts run crawl error reports, check your HTTPS status codes and eliminate duplicate content to increase crawlability and indexability.'),
    svc('Link Building', 'link-building-img.svg', '/digital-marketing-services/link-building/', 'Acquire a steady stream of traffic from high-authority websites and increase consumer trust. Our internet marketing agency leverages guest posts and collaborations to build quality backlinks that drive more sales.'),
    svc('Web Design & Development', 'web-design-img.svg', '/digital-marketing-services/web-design/', 'Our digital marketing service team builds custom, mobile-ready and search engine-optimized websites that support your campaigns — with clear CTAs, simplified forms and high-quality content for your persona.'),
    svc('Custom Website Design', 'web-design-img.svg', '/digital-marketing-services/custom-website-design/', 'Capture your target audience’s attention with a professional custom web design. Our WordPress experts analyze your industry demands, design ADA-compliant websites and provide ongoing site maintenance.'),
    svc('Social Media Marketing', 'social-media-1.svg', '/digital-marketing-services/social-media/', 'Our internet marketing services include social media campaigns that help you build strong brand awareness. We conduct competitor benchmarking and develop strategies that drive measurable growth across all social platforms.'),
    svc('Pay Per Click (PPC) Management', 'pay-per-click-img.svg', '/digital-marketing-services/pay-per-click-ppc/', 'Reach highly-targeted audience segments through data-driven PPC campaigns. Our certified specialists conduct keyword research, optimize landing pages and use remarketing and A/B testing to drive qualified leads.'),
    svc('Video Production', 'media-production-img.svg', '/digital-marketing-services/video-production-services/', 'Create a buzz with captivating, SEO-optimized video content. Our agency handles everything from location scouting and scriptwriting to motion graphics and video editing.'),
    svc('Content Writing', 'link-icon-img.svg', '/digital-marketing-services/content-writing/', 'Our content specialists stay up-to-date with market trends to adhere to Google’s standards. We write headlines that pack a punch, utilize high-performing keywords and optimize content for organic and AI search.'),
    svc('Online Reputation Management (ORM)', 'Commercial.svg', '/digital-marketing-services/online-reputation-management/', 'Strengthen your brand reputation and increase word-of-mouth referrals with proactive reputation management — pay-for-performance solutions that automate review monitoring, generation and response management.'),
    svc('Amazon Marketing Services (AMS)', 'online-marketplace-img.svg', '/digital-marketing-services/amazon-marketing/', 'Rank high on Amazon and drive more purchases with a results-driven AMS strategy combining Amazon SEO, Amazon PPC and storefront and branding to improve visibility and sales.'),
    svc('eCommerce Marketing', 'ecommerce-img.svg', '/digital-marketing-services/ecommerce-marketing/', 'Offer round-the-clock convenience with a high-performing eCommerce site. We provide eCommerce SEO and eCommerce PPC solutions to drive top-of-funnel traffic to your website.'),
    svc('Conversion Rate Optimization (CRO)', 'Commercial.svg', '/digital-marketing-services/conversion-rate-optimization/', 'Move more page visitors to the bottom of the sales funnel with Thrive’s CRO services — AI-optimized, clutter-free landing pages and verified payment systems to improve conversion rates.'),
    svc('Email Marketing', 'link-icon-img.svg', '/digital-marketing-services/email-marketing-services/', 'Keep your brand top of mind with personalized email marketing campaigns. We build your subscriber list, test campaigns before delivery and create a curiosity gap in your emails.'),
    svc('eCommerce Web Design', 'web-design-img.svg', '/digital-marketing-services/ecommerce-website-design/', 'Create immersive brand experiences with a conversion-focused eCommerce web design that prioritizes accessibility, benefit-driven copy, impactful visuals and intuitive navigation.'),
    svc('Web Hosting', 'web-design-img.svg', '/digital-marketing-services/web-design/website-hosting/', 'Our agency provides network monitoring, system backup and restoration, unlimited bandwidth and data transfer, along with a free SSL certificate to enhance your site’s security.'),
  ]);

  // ---------- why-choose reasons ----------
  await ensureCollection({ collection: 'dms_reasons', meta: { icon: 'verified', note: 'DMS — why choose Thrive reasons', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('title'), txt('description'), str('icon', 'half')]) await ensureField('dms_reasons', f);
  await reseed('dms_reasons', [
    { title: 'Data-Driven Marketing Solutions', icon: 'bar-chart-3', description: 'Deliver the right message to your target audience with results-oriented digital marketing services. We analyze your brand’s strengths, weaknesses and maximize opportunities to launch methods that drive measurable performance.' },
    { title: 'Industry Experts', icon: 'award', description: 'Our digital marketing professionals boast decades of industry expertise. We track the latest innovations, develop goal-oriented strategies and ensure all our campaigns meet search engine guidelines.' },
    { title: 'No Long-Term Commitment', icon: 'unlock', description: 'Our custom digital marketing services are flexible. Whether you scale up during peak seasons, shift focus toward lead generation or temporarily reduce spend, our experts adapt your strategy accordingly.' },
    { title: 'Human-Driven AI', icon: 'cpu', description: 'Our team leverages AI-driven insights to uncover opportunities for growth. Unlike purely automated systems, our omnichannel personalization approach remains deeply human, guided by experience and strategic thinking.' },
    { title: 'Cross-Industry Expertise', icon: 'layers', description: 'We partner with businesses of all types, sizes and budgets. Our broad experience across multiple industries lets us understand unique market challenges and deliver the best digital marketing services.' },
    { title: 'Competitive Pricing', icon: 'badge-dollar-sign', description: 'We build our internet marketing services based on your financial capacity, so you acquire the online attention you need without significant expenses. We also provide white label services that offer huge ROI.' },
  ]);

  // ---------- FAQs ----------
  await ensureCollection({ collection: 'dms_faqs', meta: { icon: 'quiz', note: 'DMS — FAQs', sort_field: 'sort' }, schema: {}, fields: [PK] });
  for (const f of [statusField, sortField, str('question'), txt('answer')]) await ensureField('dms_faqs', f);
  await reseed('dms_faqs', [
    { question: 'What is Digital Marketing?', answer: 'Digital marketing encompasses all activities of marketing an organization, business or brand across digital channels on the Internet. Strategies and tactics are crafted to target specific online audiences across a variety of internet-connected devices. All digital marketing agencies focus on optimization across search engines (Google and Bing). Top companies also prioritize AI visibility and engagement across social media, email marketing, website design and integrated applications.' },
    { question: 'What is omnichannel personalization and how does Thrive use it?', answer: 'Omnichannel personalization is the process of delivering a consistent, personalized customer experience across all platforms. Thrive uses this approach to unify messaging, data and automation across channels. This is especially important in technology marketing services, where customers interact multiple times with a brand during longer buyer journeys. Our professionals integrate data and automation to deliver cohesive, customer-centric strategies that drive revenue.' },
    { question: 'What does a Digital Marketer do?', answer: 'A digital marketer is a marketing specialist who understands how to develop and deploy effective marketing strategies online. They understand connecting with an online audience and ensure your brand engages with your consumer from the first point of contact through after-sales service.' },
    { question: 'Would my business benefit from Digital Marketing Services?', answer: 'Every single brand needs an online representation of its business. However, your digital presence won’t have any impact if you don’t market the business successfully. Businesses across industries benefit from an ongoing, comprehensive digital marketing strategy and the support of an expert marketing team.' },
    { question: 'Do you provide a custom digital marketing framework?', answer: 'Yes. Our internet marketing company takes a 360-degree approach. We review your current strategies and digital presence, set KPIs, identify your brand personality and integrate your customer experience at all levels of strategy-building to create a structured framework that optimizes all your digital touchpoints.' },
    { question: 'What can I expect from Thrive’s campaign monitoring and evaluation process?', answer: 'We establish your campaign metrics and perform regular monitoring and evaluation. Using Google Analytics, we analyze results and adjust your online marketing tactics to improve audience targeting and returns. We believe in leveraging data to gain momentum and drive growth.' },
    { question: 'How cost-effective is Digital Marketing compared with Traditional Marketing?', answer: 'Digital marketing is cost-effective because you can directly reach your ideal audience with your message. Traditional marketing casts a wide net; inbound marketing takes a targeted approach and engages the consumer at the right time. You can easily measure your efforts and associated costs, allowing you to mitigate unnecessary spending.' },
    { question: 'How do you identify a successful Digital Marketing Company?', answer: 'Look for a provider that takes the time to assess your existing and future marketing needs. An experienced agency won’t promise immediate wins because digital strategies take time. Choose a provider with proven successes, client testimonials, case studies and outstanding reviews. Be cautious about companies offering a quick fix.' },
    { question: 'What makes your digital marketing company stand out?', answer: 'Unlike other providers, Thrive focuses on building strong client relationships and achieving tangible results. As a digital advertising company with over two decades of experience, we deliver substance, not empty promises, with affordable services that maximize your budget and ROI.' },
    { question: 'What types of marketing services does Thrive offer?', answer: 'Thrive provides full-spectrum website marketing services designed to help businesses attract, engage and convert customers online. Our offerings include SEO, PPC, social media marketing, content creation, email campaigns and website optimization.' },
    { question: 'How does your internet marketing content team drive results?', answer: 'Our company creates high-quality, data-driven content that aligns with user intent and your brand’s goals. From blog posts and landing pages to video scripts and infographics, every asset supports your conversion optimization efforts.' },
    { question: 'What role does a digital marketing expert play in my success?', answer: 'An expert analyzes your data, identifies growth opportunities and implements proven tactics across channels, ensuring your digital marketing solutions are continuously refined for better engagement and ROI.' },
    { question: 'How do digital advertising services help my business grow?', answer: 'Thrive’s digital marketing methods focus on optimizing ad copy, visuals and bidding strategies to boost visibility and maximize your return on ad spend.' },
  ]);

  console.log('DMS_SETUP_DONE');
}
main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
