// Idempotent setup for the CMS-editable "Digital Marketing Strategy Development"
// page (singleton dms_strategy + fields + seed). Run with Directus up:
//   node setup-dms-strategy.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'http://localhost:8055';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = fs.readFileSync(path.join(__dirname, 'static-token.txt'), 'utf8').trim();

async function api(method, p, body) {
  const res = await fetch(`${BASE}${p}`, {
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
// Use TEXT columns (stored off-row) for every field — this singleton has ~70
// fields and a table full of varchar(255) exceeds MariaDB's 65535-byte row limit.
// `str` keeps the single-line input UI; `txt` is multiline.
const str = (field, width = 'full') => ({ field, type: 'text', meta: { interface: 'input', width }, schema: {} });
const txt = (field) => ({ field, type: 'text', meta: { interface: 'input-multiline', width: 'full' }, schema: {} });

async function main() {
  await ensureCollection({
    collection: 'dms_strategy',
    meta: { icon: 'insights', singleton: true, note: 'Editable Digital Marketing Strategy Development page' },
    schema: {},
    fields: [PK],
  });

  const fields = [
    str('seo_title'), txt('seo_description'),
    str('hero_h1'), str('hero_sub'), str('hero_form_button'),
    str('intro_h2'), str('intro_sub'), txt('intro_body'),
    str('why_eyebrow'), str('why_h2'), txt('why_body'),
    str('allows_title'), txt('allows_list'),
    str('fail_title'), txt('fail_list'),
    str('guide_h2'), str('guide_sub'), str('cta_band_text'), str('cta_band_url'),
    str('approach_eyebrow'), str('approach_h2'), txt('approach_body'), txt('approach_items'),
    str('industry_eyebrow'), str('industry_h2'), txt('industry_body'), txt('industry_items'), txt('industry_footer'),
    str('included_eyebrow'), str('included_h2'), txt('included_body'),
    str('included_s1_title'), txt('included_s1_list'),
    str('included_s2_title'), txt('included_s2_list'),
    str('included_s3_title'), txt('included_s3_list'),
    str('case_eyebrow'), str('case_h2'), txt('case_body'), str('case_label'), txt('case_desc'),
    str('case_stat1_num', 'half'), str('case_stat1_label', 'half'),
    str('case_stat2_num', 'half'), str('case_stat2_label', 'half'),
    str('case_stat3_num', 'half'), str('case_stat3_label', 'half'),
    str('focus_pre_h2'), str('focus_eyebrow'), str('focus_h2'), txt('focus_body'), txt('focus_items'), txt('focus_footer'),
    str('formula_eyebrow'), str('formula_h2'), txt('formula_body'), txt('formula_items'),
    str('services_eyebrow'), str('services_h2'), txt('services_body'), txt('services_items'),
    str('process_eyebrow'), str('process_h2'), txt('process_body'), txt('phases_items'), txt('process_footer'),
    str('whychoose_eyebrow'), str('whychoose_h2'), txt('whychoose_body'), txt('reasons_items'),
    str('faqs_h2'), txt('faqs_items'),
    str('cta_h2'), txt('cta_text'), str('cta_btn1_text', 'half'), str('cta_btn1_url', 'half'), str('cta_btn2_text'),
  ];
  for (const f of fields) await ensureField('dms_strategy', f);

  const content = {
    seo_title: 'Digital Marketing Strategy Development Services | Thrive',
    seo_description: `Thrive's digital marketing strategy development services map a clear, data-driven path to your goals across SEO, PPC, content and social - no long-term commitment.`,
    hero_h1: 'Digital Marketing Strategy Development',
    hero_sub: 'Build a Clear Roadmap to Online Growth',
    hero_form_button: 'GET MY FREE PROPOSAL',

    intro_h2: `You Know What You Want, But You're Not Sure How to Get There`,
    intro_sub: `We Ensure You Don't Take the Wrong Turn En Route to Success`,
    intro_body: `A recent report revealed that nearly 50% of businesses don't have a clearly defined online marketing strategy to steer their digital marketing efforts. This means many market leaders are investing their time, money and resources in organic and paid digital marketing services without a well-planned approach for goal setting and achievement, task prioritization, marketing direction and budget and resource allocation.

Where are you now? Where do you want to be? What is the best approach to achieve your business goals? Where does your digital marketing budget go? Our digital strategy company addresses these questions to help you generate lucrative online marketing ideas and get you to your desired destination.

Let us assist you in building a robust online digital marketing strategy framework for your brand. Get your digital marketing campaign moving with Thrive Internet Marketing Agency.`,

    why_eyebrow: 'Uncover Market Opportunities and Increase Your Revenue',
    why_h2: 'Why You Need to Start With Strategy',
    why_body: 'Marketing your brand without an internet marketing strategy or using a weak online marketing plan is how to lose money, waste time and get nowhere.',
    allows_title: 'A Concrete Digital Marketing Strategy Allows You To:',
    allows_list: `Determine marketing gaps
Expand your reach
Improve audience targeting
Save time, money and resources
Increase traffic, leads and conversions
Generate better, faster revenue
Discover more opportunities to build brand awareness
Take appropriate actions
Measure campaign performance and brand success
Build a brand reputation
Scale business
Compete with industry giants
Accomplish business goals
Manage your financial resources`,
    fail_title: 'Without a Well-Defined, Effective Online Marketing Strategy, You Fail To:',
    fail_list: `Define clear goals
Identify and fix digital marketing mistakes
Grow your sales pipeline
Leverage available marketing channels
Outperform your competitors
Allocate and spend your digital marketing budget wisely
Build your customer base
Establish brand confidence
Deliver sales leads
Increase traffic flows and conversions
Grow your industry expertise
Provide excellent customer service
Engage with prospects across platforms
Take advantage of marketing trends and sales opportunities`,

    guide_h2: 'You Will Run Into Obstacles Along the Way, But We Guide You to a Clear Path',
    guide_sub: 'Define Your Long-Term Goals and Achieve Them',
    cta_band_text: 'Get My Free Strategy Proposal',
    cta_band_url: '/',

    approach_eyebrow: 'Visualize a Clear Marketing Direction',
    approach_h2: `Thrive's Strategy Approach`,
    approach_body: `Thrive's internet marketing consultant services are designed to help you get from your existing market position (point A) to a competitive industry standing (point B).`,
    approach_items: `No Defined Goal | Our internet marketing strategy company helps you determine your objectives to set your marketing efforts in the right direction.
Efforts Not Getting to Goal | We pinpoint why your current efforts aren't reaching your targets and recalibrate your strategy to close the gap between activity and results.
Too Many Goals. Thin Resources. | Get in touch with our digital strategy company and let's talk about how to best achieve your marketing objectives, depending on your unique situation.`,

    industry_eyebrow: 'Choose a Reliable Firm That Maps Out Every Step',
    industry_h2: 'Our Marketing Strategy Agency Considers Your Unique Industry',
    industry_body: 'Six top considerations when choosing a digital strategy partner:',
    industry_items: `Web Audit Practices | A thorough audit of your website's technical health, content and performance to establish your starting point.
eCommerce Marketing Strategy | Tailored plans that grow online store traffic, conversions and revenue.
Online Marketplace Advertising Plan | Targeted strategies for Amazon, Walmart and other marketplaces where your buyers shop.
Marketing Flexibility | Adaptable plans that scale with your budget, capacity and changing market conditions.
Advertising Strategy | Paid media planning across search, social and display to reach the right audience profitably.
SEO Website Strategy | A search-first roadmap that improves rankings, organic traffic and qualified leads.`,
    industry_footer: 'Let us show you how to develop a unified social media marketing strategy and web marketing plan that converts leads into sales.',

    included_eyebrow: 'Get a Comprehensive Package of Resources',
    included_h2: `What's Included in Your Web Marketing Strategy?`,
    included_body: 'Once you partner with us, we provide a complete marketing strategy plan that maps out a clear path to your goal, plus an executive summary and video for your team to review:',
    included_s1_title: 'Section 1: Scorecard Results and Recommendation',
    included_s1_list: `Custom "Marketing Scorecard" with detailed explanation
Top business goals and supporting 2nd-tier goals`,
    included_s2_title: 'Section 2: Solutions and Plan',
    included_s2_list: `Recommended solutions
The plan on how to accomplish the solutions
What phases we recommend, in which order`,
    included_s3_title: 'Section 3: Worksheet and Investment',
    included_s3_list: `A clear worksheet on your recommended strategy and how each channel contributes to your goal
One-page snapshot
Investment to accomplish the plan`,

    case_eyebrow: 'Strengthen Your Brand and Gain a Competitive Edge',
    case_h2: 'A Digital Strategy Firm That Delivers',
    case_body: `Need help with your corporate marketing strategy? Whether you own a startup, enterprise or multiple-location business, a Thrive digital strategy consultant can develop the right internet marketing strategies for your specific needs and demands.

To give you a clear picture of how our internet marketing consultant services can improve your existing metrics and overall market standing, here's an overview of what we've accomplished over the last year for a multi-location property restoration company:`,
    case_label: 'Case Study',
    case_desc: `We've divided the franchise marketing plan into phases and executed the necessary optimizations and updates. Within a year, we generated a total of 89,422 leads across 180 locations and increased the client's organic traffic by approximately 57 percent.`,
    case_stat1_num: '+89,422', case_stat1_label: 'Total Leads',
    case_stat2_num: '+57.4%', case_stat2_label: 'Organic Traffic',
    case_stat3_num: '+13.5%', case_stat3_label: 'PPC Conversion Rate',

    focus_pre_h2: 'An Advanced Strategy Points You in the Right Direction',
    focus_eyebrow: 'We Identify Exactly Which Areas Need Attention',
    focus_h2: '6 Key Areas of Focus for Digital Marketing Strategy Development',
    focus_body: 'To ensure we outline a digital marketing plan tailored to your brand, we ask you to complete a self-assessment questionnaire based on six core areas:',
    focus_items: `Brand and Business | Evaluates the level of your digital presence, including competitive position, online reputation and customer relationship management (CRM).
Content and Engagement | Assesses your brand engagement, social media marketing strategy, email marketing strategy and content strategy SEO performance.
Internal Team or Partners | Determines your capacity to generate online marketing ideas and perform necessary web optimization processes.
Technology and Software Integration | Identifies your organization's major challenges in tracking campaign performance metrics.
Lead Sources | Determines your key traffic sources and the availability of essential marketing channels.
Success Measurement | Evaluates your campaign performance based on factors such as customer lifetime value (CLV), lead volume and website traffic.`,
    focus_footer: 'Our consultants rate your performance on each criterion and identify the gap between your self-assessment and the Thrive score, so we can guide you on where you should be for your industry, growth phase and location.',

    formula_eyebrow: 'Drive Gains at Both Ends of Your Sales Funnel',
    formula_h2: `Thrive's Growth Formula Delivers the Most Effective Results`,
    formula_body: 'Our digital strategy agency developed a growth formula to ensure our combined digital marketing ideas do not just attract leads but also turn customers into brand advocates:',
    formula_items: `STRATEGIZE | We determine your goal from the get-go and identify your target audience to create all-inclusive web marketing strategies that capture every stage of your sales funnel.
ATTRACT | We lay out your customer journey map and choose the channels to draw prospects toward your brand - SEO, social media, content marketing and PPC.
CONVERT | We prioritize the components and processes - landing pages, CTAs and customer-centric content - that turn site visitors into leads.
CLOSE | We devise a plan with actionable insights that highlight your unique value proposition and move sales-qualified leads to paying customers.
DELIGHT | We create long-term strategies focused on personalized customer experiences that retain loyal clients and turn them into brand advocates.`,

    services_eyebrow: 'We Zero In on the Digital Marketing Services That Fit Your Business',
    services_h2: 'We Help You Decide Which Approach Is Right for You',
    services_body: 'At Thrive, we provide a unified digital marketing strategy plan that addresses your primary goal. These are some of the components that may be included, depending on your needs, budget and capacity:',
    services_items: `Website Audit Services
SEO Strategy
SEO Keyword Strategy
SEO Content Strategy
PPC Strategy
SEM Strategy
Amazon Marketing Strategy
Social Media Strategy Services
Link Building Strategy
Reputation Management Strategy
eCommerce Marketing Plan
Franchise Marketing Strategy`,

    process_eyebrow: 'A Healthy Money Tree Needs Nurturing From the Roots to the Branches',
    process_h2: `Thrive's Marketing Strategy Process`,
    process_body: 'As your dedicated marketing strategy consultant, we treat our partnership as if we are nurturing a money tree. To strengthen it, our internet marketing plan comprises three critical stages:',
    phases_items: `PHASE 1: ROOT FIXES | Information Gathering, Assessments and Interviews | We perform website SEO analysis and in-depth campaign evaluation to determine your key traffic sources and the technical SEO factors affecting your digital presence - site speed, server settings, GMB listings, 404s, backlink profile and trust signals.
PHASE 2: TRUNK GROWTH | Analysis and Recommendations | We analyze the key metrics from Phase 1 and determine the best approach to optimize your site architecture, content, CTAs, keyword strategy, social profiles, landing pages and email performance.
PHASE 3: BRANCH CARE | Presentation of the Strategy | We leverage the data from the previous phases to design and present a holistic digital marketing business plan that maximizes results from your SEO, ads, email, social and reputation management.`,
    process_footer: 'Let us help you grow a healthy money tree. Contact us today to discuss each component of your marketing strategy plan.',

    whychoose_eyebrow: 'Leverage Our Industry Expertise and Knowledge',
    whychoose_h2: 'Why Choose Thrive for Your Digital Marketing Business Plan',
    whychoose_body: `The development of a digital marketing strategy is a crucial process that requires rigorous research and analysis. Here's what you can expect when you partner with our digital strategy agency:`,
    reasons_items: `Multidisciplinary Team | A full bench of specialists across SEO, PPC, web, social and content collaborate on your strategy.
No Commitment Necessary | Take our marketing strategy plan and implement it yourself, work with another agency or partner with us - no long-term contract required.
Established Reputation | Since 2005 we've earned thousands of reviews and industry awards for delivering measurable results.
Unified Plan Across Delivery Teams | One cohesive strategy keeps every delivery team aligned to the same goals and KPIs.
Custom Marketing Strategy Packages | Plans are tailored to your industry, budget and growth phase - never one-size-fits-all.
Holistic Strategy Approach | We look at your entire funnel so every channel works together toward your business goals.`,

    faqs_h2: 'Digital Strategy Development FAQs',
    faqs_items: `What does a marketing strategy agency do? | A marketing strategy agency researches your market, audience and competitors, then maps a data-driven plan that aligns the right channels, budget and tactics to your business goals.
Why is digital strategy development important? | Without a defined strategy you waste budget and time. A strategy uncovers opportunities, sets clear goals and measures performance so every dollar drives growth.
How do you measure the success of a marketing strategy for a website? | We track KPIs tied to your goals - organic traffic, leads, conversion rate, customer lifetime value and ROI - and benchmark them against your industry.
How does a strategic digital marketing approach work? | We assess your starting point, identify gaps, prioritize fixes and growth opportunities in phases, then execute and refine based on performance data.
What industries benefit from professional online website marketing strategies? | Any industry - startups, enterprises, eCommerce, franchises and multi-location businesses - benefits from a tailored, goal-driven strategy.
How long does it take to see results from a digital marketing growth strategy? | Timelines vary by channel and competition; paid media can show results quickly, while SEO typically compounds over several months.
When's the best time to prioritize the development of a marketing strategy? | The best time is before you spend on execution - a strategy ensures your budget and effort are pointed at the right goals from day one.
Can you develop strategies for businesses with limited marketing budgets? | Yes. We build flexible, prioritized plans that focus your limited budget on the highest-impact channels first.`,

    cta_h2: 'Ready to Build Your Digital Marketing Strategy?',
    cta_text: `Partner with a digital strategy agency that's obsessed with your results. Tell us about your goals and we'll map a clear path to get there - no commitment required.`,
    cta_btn1_text: 'Get My Free Proposal', cta_btn1_url: '/',
    cta_btn2_text: 'Call 866-908-4748',
  };

  let seed = await api('PATCH', '/items/dms_strategy', content);
  if (!seed.ok) seed = await api('POST', '/items/dms_strategy', content);
  if (!seed.ok) throw new Error('seed dms_strategy: ' + JSON.stringify(seed.json));
  console.log('dms_strategy content seeded');
  console.log('DMS_STRATEGY_SETUP_DONE');
}

main().catch((e) => { console.error('SETUP_ERROR:', e.message); process.exit(1); });
