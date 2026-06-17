<!--
This is the Nexoris Technologies Digital Platform Product Requirements Document, placed
here verbatim from the approved PRD as the read-only source of truth for system behaviour.
Do not edit. Page text is governed by the approved Website Copy in content-source/.
-->

NEXORIS TECHNOLOGIES DIGITAL
PLATFORM
Product Requirements Document
Domain: nexoristech.com Date: June 2026
Sources of truth: the approved Website Sitemap and Content Architecture and the four
approved Website Copy files. This document consolidates them into a single authoritative
PRD and extends them to cover the CMS and the CRM. Page H1s, sections, hero sublines,
CTAs, and metas are final and are not changed here. The Website Copy files and this PRD
together are the single source of truth for the build. Where they ever conflict on scope, the
Website Copy governs page text and this PRD governs system behaviour.
Prepared by the cross-functional team: Senior Product Manager, Product Designer, Branding
Expert, Fullstack Engineer, AI Engineer, SEO Specialist, Strapi Developer, and QA Engineer.
Each section is written from the relevant lens and the document is internally consistent
across all of them.
House rules, enforced on every string in the product (UI labels, alt text, errors, emails,
commits, and all AI output): plain spoken English, complete sentences, the way a
knowledgeable person explains things across a table. No em dashes anywhere. No
buzzwords, jargon, or cliches. No awkward background color or shadow. "Nexoris
Technologies" is always written in full. The website assistant is named Oge and speaks
English only. Every clickable element must have cursor-pointer implemented.
This PRD is organised into three parts that match how the product is built and operated:
Part One: The Website, the public marketing site at nexoristech.com. Part Two: The CMS,
the Strapi content platform that powers Insights, authors, careers, legal pages, and the
programmatic SEO layer. Part Three: The Internal Admin Dashboard, the in-house staff
platform for running Nexoris Technologies. It is designed as a modular dashboard, and this
build delivers its first module, the CRM, which receives and works the leads the website
produces. The other modules are planned for later builds.
A final cross-cutting part covers quality assurance, the delivery plan, risks, and reuse.
PART ONE: THE WEBSITE
1. Project context and conventions
1.1 Domain
nexoristech.com
1.2 Slug conventions
All slugs sit directly under the root. There are no /services/ or /industries/ parent paths.
Grouping is carried by navigation, breadcrumbs, schema, and internal links, not by folder
depth.
1.3 Meta copy constraints
Meta title maximum 60 characters. Meta description targets 155 to 160 characters, with 160
the hard maximum. Both are enforced in the CMS with live counters and in CI with the
check:seo gate.
1.4 Voice rules
Plain, simple words. Complete sentences. Honest, even when it is not what the reader
expected to hear. No em dashes. No buzzwords, jargon, or cliches. This applies to body
copy, UI text, AI output, and email drafts alike.
1.5 AI positioning
AI is presented as something Nexoris Technologies adds where it genuinely helps, never as
something forced into every product.
1.6 Brand name rule
"Nexoris Technologies" is always written in full, never shortened.
1.7 In-house products
Covyvo and GLEEN have their own websites. They do not get standalone pages on
nexoristech.com. They appear only inside the Case Studies section as in-house projects,
with outbound links to their own sites. Their mockups are provided as assets. Do not add the
outbound link yet as the sites are not live at the moment.
2. Site structure and URL architecture
2.1 Full directory
nexoristech.com/
/ Home
/about About Nexoris Technologies
/how-we-work How we deliver projects
/case-studies Our work and results
/case-studies/[slug] Case study detail (template)
/insights Insights hub (Strapi-driven)
/insights/[slug] Insights article (template)
/authors/[slug] Author profile page (template)
/careers Careers hub (Strapi-driven)
/careers/[slug] Job opening detail (template)
/contact Contact and start a project
SERVICES (11 pages, flat, in the Services flyout)
/ai-product-development
/ai-chatbots-virtual-assistants
/business-process-automation
/ai-ecommerce-development
/data-dashboards-predictive-analytics
/ai-systems-integration
/data-infrastructure-ai-readiness
/iot-development
/govtech-platforms
/ai-seo-geo
/managed-technology-operations
INDUSTRIES (20 pages, flat, in the Industries flyout)
/education-software
/healthcare-software
/hospitality-software
/restaurant-software
/retail-ecommerce-software
/real-estate-software
/logistics-software
/fintech-software
/insurance-software
/manufacturing-software
/agritech-software
/professional-services-software
/church-management-software
/ngo-software
/government-digital-solutions
/construction-software
/media-entertainment-software
/fitness-wellness-software
/automotive-software
/events-software
LEGAL (Strapi single types)
/privacy-policy
/terms-of-service
/cookie-policy
2.2 Programmatic SEO pages (generated layer, flat slugs)
Service and industry combinations, slug pattern /{service-keyword}-for-{industry-keyword}.
Examples: /chatbot-for-hospitals, /pos-system-for-restaurants, /erp-for-manufacturers,
/crm-for-real-estate-agents, /booking-system-for-hotels, /inventory-software-for-retailers,
/loan-management-software-for-microfinance-banks.
Cost and pricing pages: /website-development-cost-nigeria,
/mobile-app-development-cost-nigeria, /ecommerce-website-cost-nigeria, /erp-cost-nigeria,
/chatbot-development-cost-nigeria.
Comparison pages: /shopify-vs-custom-ecommerce, /wordpress-vs-custom-website,
/off-the-shelf-vs-custom-erp, /build-vs-buy-business-software.
Location pages: /software-development-company-lagos, /app-developers-abuja,
/web-design-company-port-harcourt, plus equivalents for cities where demand data justifies
them.
Industry, technology, and location permutation pages (the highest-intent set, governed by the
framework in Section 9.6), slug pattern /{tech-or-service}-for-{industry}-in-{location}.
Examples: /flutter-app-development-for-fintech-in-lagos,
/custom-web-app-development-for-ecommerce-in-abuja,
/school-portal-development-for-edtech-in-port-harcourt,
/api-integration-for-logistics-in-ibadan. These combine an industry, a tech stack or service,
and a Nigerian hub (with an optional budget or constraint axis), are generated from a clean
database of the variable sets, and each one must clear the non-negotiable quality gate in
Section 9.7 before it publishes.
Programmatic pages can also be generated from Insights articles, so a strong article on a
commercial topic can seed a matching evergreen page. The generation pipeline picks up
new article topics and proposes programmatic pages from them, subject to the same quality
gates (Part Two, Section 10).
3. Overview and objectives
3.1 Purpose
Build the public website for Nexoris Technologies: a fast, accessible, search-dominant
marketing site that proves the company builds production-grade software by being an
example of it, converts commercial and transactional search intent across 11 services and
20 industries, and turns visitors into scored leads inside the CRM module of the Nexoris
Technologies internal admin dashboard, with an assistant, Oge, grounded strictly in the site's
own knowledge base and speaking English.
3.2 Measurable objectives
Rank and earn citations for commercial and transactional queries across every service and
industry, on Google, in AI Overviews, and inside AI answer engines. Every lead reaches the
admin dashboard CRM module scored, with a clear justification and full context, within a few
seconds of submission. Core Web Vitals in the green and Lighthouse 95 or above on the
four sampled page classes, mobile and throttled. Oge answers only from Nexoris
Technologies content, declines off-topic in one sentence, and never fabricates a price,
timeline, or result. AI model usage stays inside free or low tier limits through the caching,
deterministic-first, and fallback strategy in Section 10, with no visitor-facing failure when a
limit is reached.
3.3 Users
Prospect or visitor: arrives from search or referral, reads, then contacts the team, chats with
Oge, or uses the Solution Finder. The lead they create is scored and routed in the admin
dashboard CRM module. Editor or marketing: publishes Insights, manages authors, edits
legal pages, posts jobs, and reviews AI suggestions in Strapi. Salesperson and admin: sign
in to the Nexoris Technologies internal admin dashboard and work scored leads in its CRM
module, which is integrated with Oge for scoring, auto-response drafting, and service
recommendations (Part Three).
4. System architecture
4.1 Topology
Visitor (browser, mobile-first)
|
HTTPS
|
apps/web Next.js (App Router, SSG/ISR)
- 33 hardcoded marketing pages (static)
- programmatic SEO pages (generated, ISR)
- Insights, authors, careers, legal (ISR from Strapi)
- Oge widget, Solution Finder, forms (UI)
| |
REST (read, cached) HTTPS (SSE + JSON)
| |
apps/cms apps/oge
Strapi v5 NestJS, AI gateway
- Insights, authors - Oge chat (RAG)
- Careers, legal - Solution Finder
- Proof data - Lead scoring
- pSEO drafts - Smart form, acknowledgement
- Media (WebP, on VPS) - KB index, caches, fallback chains
| | |
webhooks | AI providers
(publish) | (Gemini, Groq, SambaNova)
| |
PostgreSQL PostgreSQL
nexoris_cms nexoris_oge (+ pgvector)
|
shared AI gateway
|
apps/admin (Oge-integrated)
Internal Admin Dashboard
CRM module (this build)
nexoris_admin DB
Meilisearch (site + KB search) VPS filesystem (media, WebP, no CDN)
4.2 Components and responsibilities
apps/web (Next.js, TypeScript strict, Tailwind): renders everything. Hardcoded marketing
pages are statically generated; programmatic SEO, Insights, authors, careers, and legal
pages render via ISR. The browser talks only to apps/web and, for chat and forms, to
apps/oge. The browser never calls an AI provider. apps/cms (Strapi v5 + PostgreSQL
nexoris_cms): Insights, authors, careers, legal pages, proof data, and programmatic-page
drafts (Part Two). apps/oge (NestJS, the shared AI gateway): the only component that calls
any AI provider. Owns retrieval, the cache layers and quota governor, the knowledge-base
index, lead scoring, the smart form assistant, the personalised acknowledgement, the
Solution Finder rationale, the CMS AI helpers, and the AI features of the admin dashboard
CRM module. Database nexoris_oge with pgvector. apps/admin (the Nexoris Technologies
internal admin dashboard, Oge-integrated): the staff-facing dashboard for running the
company, built as a modular platform. This build delivers its first module, the CRM, which
receives scored leads and uses Oge for scoring with justification, auto-response drafting,
and service recommendations. Other modules are planned for later builds and are out of
scope here. Full behaviour in Part Three. PostgreSQL: one server, a database per app
(nexoris_cms, nexoris_oge, nexoris_admin). Meilisearch: site and Insights search plus Oge
keyword retrieval. Media: stored on the VPS filesystem and served directly, converted to
WebP at upload. No CDN.
4.3 Monorepo and stack
pnpm workspaces and Turborepo. apps/web, apps/cms, apps/oge, apps/admin (the internal
admin dashboard, CRM module in this build), plus packages/ui (design system),
packages/seo (schema, OG, sitemaps), packages/config (tsconfig, eslint, Tailwind brand
preset), packages/kb (knowledge-base builder shared by the web build and Oge). Node LTS.
All AI via apps/oge; provider keys exist only there. Model identifiers are pinned in
apps/oge/src/config/models.ts; verify the current provider-specific model string for each entry
against the official API documentation before pinning, since version strings change.
4.4 Trust boundaries
The browser may call apps/web routes and the public apps/oge endpoints (chat, finder,
form-assist, submit), all rate-limited and input-capped. Retrieved knowledge-base content is
treated as data, never as instructions. AI providers are reached only server-side from
apps/oge. The admin dashboard CRM intake authenticates apps/oge by shared secret.
5. Goals, non-goals, and success criteria
5.1 Non-goals
No e-commerce or payments on the marketing site, no real-time per-keystroke AI beyond
the debounced smart form assistant, no multi-language site chrome (Oge speaks English
only; French content is a planned future locale, deferred), no native mobile apps, and no
sending email from the website (the admin dashboard CRM module sends; the website
drafts only).
5.2 Success criteria
A release ships only when all pass in CI and manual QA: All routes build and render with
zero errors; rendered copy matches the approved files verbatim. check:seo passes on every
route (Section 9.11). check:a11y (axe-core) passes with zero serious or critical issues on
every route. Core Web Vitals and Lighthouse targets met on the four sampled page classes,
mobile and throttled. A submission from the form, Oge, or Solution Finder arrives at the
admin dashboard CRM module scored with a clear justification, source, page, and context,
within a few seconds. Oge answers only from the knowledge base in English, declines
off-topic in one sentence, captures a lead only with on-screen confirmation, and degrades to
a contact panel when its providers or quota are unavailable. Layout is correct and usable
down to 280px width. No em dash anywhere in the diff; no buzzwords, jargon, or cliches in
any copy or AI output; no standalone "Nexoris" in any user-facing string.
6. Architecture decision: hardcode marketing pages
6.1 What is hardcoded
Hardcoded as version-controlled content modules in apps/web (typed MDX or TS generated
once from the approved copy, so on-screen text matches the copy files verbatim): Home,
About, How We Work, Contact, Case Studies hub, all 11 service pages, all 20 industry
pages. These change rarely; their value is performance and SEO precision. Hardcoding
removes a network hop, removes a class of CMS-outage risk, and makes them statically
fast.
6.2 What is Strapi-managed
Strapi-managed because they change often or must be editable without a deploy: Insights
hub and articles, author profiles, the careers hub and job openings, the three legal pages,
and the programmatic-page drafts (generated and human-gated, Part Two).
6.3 Consequences
Strapi holds a focused set of types (Part Two, Section 2). Dynamic proof on hardcoded
pages (case study cards, testimonials) is served from a small cached content API so proof
updates without redeploying pages, and absent proof renders nothing. The knowledge base
grounding Oge is built from the hardcoded modules at build plus published Strapi content on
each publish, so the assistant always knows the entire site.
7. Navigation and global UI
7.1 Header
Sticky header, 72px desktop, 64px mobile. Transparent over the dark hero, solid white with a
soft shadow once the page scrolls. Fully keyboard operable: Tab moves through items, Enter
or Down Arrow opens a flyout, Escape closes it, and focus returns to the trigger. Layout: the
Nexoris Technologies logo on the left, then Services, Industries, Insights, Company, and a
Start a project button on the right.
7.2 Services flyout (mega menu, two columns, sorted by importance
from the top left)
Each item carries a short plain-language line so a first-time visitor understands it without
clicking.
Column 1 (most important): AI Product Development, /ai-product-development, "Websites,
apps, and custom software, built around your business" AI Chatbots and Virtual Assistants,
/ai-chatbots-virtual-assistants, "Answer customers any time, on your website or WhatsApp"
Business Process Automation, /business-process-automation, "Let software handle the
repetitive work" AI E-Commerce, /ai-ecommerce-development, "Online stores that sell more,
day and night" Data Dashboards and Analytics, /data-dashboards-predictive-analytics, "See
your numbers live and know what is coming"
Column 2: AI and Systems Integration, /ai-systems-integration, "Make the tools you already
use share data automatically" Data Infrastructure and AI Readiness,
/data-infrastructure-ai-readiness, "Clean up your data so reports and AI give right answers"
IoT Development, /iot-development, "Track your vehicles, machines, and cold rooms live"
GovTech Platforms, /govtech-platforms, "Digital services for government and public
agencies" AI Content, SEO and GEO, /ai-seo-geo, "Get found on Google and inside AI tools
like ChatGPT" Managed Technology Operations, /managed-technology-operations, "We
keep your software running and improving after launch"
Featured panel text: "Not sure which one you need? Tell us what is going on in your
business and we will point you to the right place." Button: Find the right service.
7.3 Industries flyout (mega menu, four columns)
Commerce and consumer: Retail and E-Commerce, Restaurants and QSR, Hospitality and
Short-Lets, Real Estate, Automotive, Events and Weddings, Media and Entertainment.
Health and people: Healthcare and Clinics, Education and EdTech, Fitness, Beauty and
Wellness, Professional Services, Insurance. Operations and assets: Logistics and Supply
Chain, Manufacturing, Construction and Engineering, Agriculture and Agritech, Financial
Services and Fintech. Public and purpose: Government and Public Sector, NGOs and
Non-Profits, Faith Organisations.
Featured panel text: "Your exact business is not listed? Tell us what you do. The thinking
travels well." Link: Talk to us.
7.4 Company flyout (simple dropdown)
About Us, /about. How We Work, /how-we-work. Case Studies, /case-studies. Careers,
/careers. Contact, /contact.
7.5 CTA button
"Start a project", links to /contact. Solid #543CDA, white text, visible focus ring.
7.6 Mobile navigation
A hamburger opens a full-screen drawer with accordions for Services, Industries, and
Company. A sticky bar at the bottom of the drawer holds the Start a project button and a
WhatsApp button.
7.7 Insights link
A direct link to /insights, no flyout.
7.8 Footer
Background ink-950 (#0D0A1C). Five columns plus a bottom bar. Column 1, Nexoris
Technologies: the white logo, the line "We design and build custom software for businesses
in Nigeria and abroad.", the address 5, Mojisola Dokpesi Street, Allied Garden Estate,
Badore, Ajah, Lagos State, Nigeria, the phone +234 913 813 3224, hello@nexoristech.com
for general and business@nexoristech.com for new business, and the WhatsApp, LinkedIn,
X, Instagram, and YouTube links. Column 2, Services: all 11, in the flyout order of
importance. Column 3, Industries: the top 10 by expected demand (Education, Healthcare,
Fintech, Retail and E-Commerce, Logistics, Real Estate, Hospitality, Restaurants,
Government, Manufacturing), with "See all 20 industries" linking to the Home industries grid
anchor. Column 4, Company: About Us, How We Work, Case Studies, Insights, Careers,
Contact. Column 5, Start a conversation: "Tell us what you are trying to achieve. We will
come back with a clear suggestion and honest numbers.", a Start a project button, a Find the
right service ghost button, and the newsletter capture labelled "One useful idea each month.
You can unsubscribe any time." with a Subscribe button. Bottom bar: the copyright line for
Nexoris Technologies Ltd, links to Privacy Policy, Terms of Service, and Cookie Policy, and
the line "Built in Lagos. Working everywhere."
8. Cross-linking matrix
All links are Strapi relations or content-module references so marketing can adjust them
without a deploy. Each service page links to its highest-relevance industries, and each
industry page links back to its core services.
AI Product Development: Fintech, Healthcare, Education, Retail, Logistics (rotated by traffic).
AI Chatbots and Virtual Assistants: Healthcare, Fintech, Government, Hospitality, Retail,
Faith Organisations. Business Process Automation: Professional Services, Fintech,
Insurance, Manufacturing, NGOs. AI E-Commerce: Retail, Restaurants, Automotive, Media,
Fitness and Beauty. Data Dashboards and Analytics: Manufacturing, Logistics, Retail,
NGOs, Construction. AI and Systems Integration: Retail, Manufacturing, Fintech, Logistics,
Professional Services. Data Infrastructure and AI Readiness: Fintech, Insurance,
Government, Manufacturing, Healthcare. IoT Development: Logistics, Manufacturing,
Agriculture, Construction, Healthcare. GovTech Platforms: Government, NGOs, Education,
Healthcare. AI Content, SEO and GEO: Real Estate, Hospitality, Professional Services,
Media, Events. Managed Technology Operations: referenced from every service page footer.
9. SEO, GEO, AEO, schema, and Core Web Vitals
The aim: when someone searches a commercial or transactional query tied to any Nexoris
Technologies service, the site appears in organic results, in Google's AI Overview, and as a
cited source inside AI answer engines.
9.1 Foundations (every page)
Flat slugs are deliberate. Grouping is carried by the flyout menus, breadcrumbs,
BreadcrumbList schema, and the cross-linking matrix, so no SEO value is lost by skipping
parent folders. A reserved-slug list in Strapi protects every routable path, so no new page
can collide with an existing one. Canonical tags on every page. An XML sitemap split into
logical groups (core, services, industries, insights, authors, careers, programmatic)
regenerated on every publish. robots.txt and llms.txt at the root. One watch item:
/govtech-platforms (the capability) and /government-digital-solutions (the sector) target
different intents and are kept clearly distinct so they never compete for the same query.
9.2 Schema markup per page, with NG locale
Builders are pure, unit-tested functions in packages/seo. Every route emits one JSON-LD
@graph. Locale facts everywhere: inLanguage en-NG, og:locale en_NG, addressCountry
NG, currenciesAccepted NGN. Builders omit any field whose data does not exist, so the site
never emits fabricated structured data.
Site-wide nodes on every page, by stable @id: Organization: legalName "Nexoris
Technologies Ltd", logo ImageObject, email hello@nexoristech.com, telephone
+2349138133224, full NG PostalAddress, founder reference, sales contactPoint with
areaServed NG and availableLanguage en, sameAs the verified profiles.
ProfessionalService: the LocalBusiness subtype, with address NG, geo from the global
single type (omitted until set), openingHours Monday to Friday 09:00 to 18:00, priceRange
"$$", currenciesAccepted NGN, areaServed Nigeria, parentOrganization the Organization.
WebSite: publisher the Organization, inLanguage en-NG, SearchAction pointing to
/insights?q={search_term_string}. Person: founder Chinedu Nwogu, worksFor the
Organization.
Per page: WebPage (name, description, isPartOf the WebSite, primaryImageOfPage,
breadcrumb, inLanguage en-NG, dates), subtyped AboutPage, ContactPage,
CollectionPage (hubs). ImageObject for the primary image, caption from alt text.
BreadcrumbList.
Per route class: Service pages (11): a Service node (provider the Organization, areaServed
Nigeria, availableChannel /contact) plus FAQPage from the page's FAQ module. Industry
pages (20): a Service node with serviceType "{industry} software development" and an
audience, plus FAQPage. Insights articles: full schema described in Part Two, Section 11
(Article or BlogPosting with author Person, reviewer Person for the fact-checker, publisher
Organization, dates, articleSection, inLanguage en-NG), plus FAQPage from the article's
auto-generated FAQ section. Author pages: ProfilePage with a Person mainEntity (name,
jobTitle, the up to three roles, sameAs LinkedIn, knowsAbout topics, worksFor the
Organization). Case study details: Article with about referencing the related service and
industry. Careers: JobPosting per open role with NG jobLocation, employmentType,
hiringOrganization the Organization, zero when none open. Legal pages: WebPage only.
pSEO pages: Service plus FAQPage with serviceType set to the specific combination.
FAQPage is emitted only when an FAQ section exists on the page, never empty.
9.3 Open Graph and social cards
Every page emits og:title, og:description, og:image (a branded card built server-side at
1200x630px), og:locale en_NG, and og:type website or article for Insights. The Twitter card
is summary_large_image. The branded card is the one PNG that reaches a visitor (the
documented WebP exception); all other raster images are WebP.
9.4 Programmatic SEO layer 1: service and industry pages
These are the exact phrases buyers type when ready to spend, for example "chatbot for
hospitals in Nigeria", "POS system for restaurants". Slug pattern flat:
/{service-keyword}-for-{industry-keyword}. Three quality gates before publishing: real search
demand from keyword data, a genuine catalogue fit between that service and that industry,
and enough unique substance to deserve its own page. Combinations that fail any gate stay
unpublished. Page template, unique content per page, never spun: an H1 in the buyer's own
words, three to four pain points specific to that combination, what we build for it, where AI
helps and where it fits, a relevant case study or scenario, pricing guidance in honest Naira
ranges, five FAQs answering the real commercial questions, and a CTA band. Every block is
drafted by AI from the catalogue's real mappings and the researched demand patterns, then
edited and approved by a person in Strapi before publish. Each combination page links up to
its parent service and industry pages, which link back from a "More specific solutions" block.
Publishing is paced by the data-readiness gate in Section 9.7, not by a target count: a
deliberately small first wave of fully data-complete pages goes live, and the set grows one
ready page at a time toward the full matrix of around 220 as real distinct data is added. Not
all combinations are published.
9.5 Programmatic SEO layer 2: transactional and comparison templates
Cost and pricing pages lead with an honest Naira range in the first 80 words, then explain
the factors that move it, give a worked example, and offer a calculator where it helps. Honest
numbers are rare in this market, which is exactly why these pages win clicks, AI Overview
slots, and trust at once. Comparison pages are written with genuine balance, including when
the cheaper or off-the-shelf option is the right answer, because balanced comparisons are
what answer engines prefer to cite. Location pages carry genuinely local content: local
context and a local contact path. "Best" listicles live in Insights, because list content ages
and belongs in an editorial stream.
9.6 The programmatic framework: Industry plus Technology plus
Location and Budget permutations
The highest-value programmatic strategy for a software agency is not basic locations alone.
It is permutations of industry, technology or service, and location or constraint, because
those match the exact high-intent queries a buyer types when ready to hire. The core
framework is: [Industry] plus [Core Service or Tech Stack] plus developer or agency plus in
plus [Location or Constraint]. From a clean database of these variables the system
generates hundreds of highly targeted, high-intent landing pages, every one of which must
still clear the non-negotiable quality gate in Section 9.7.
The variable sets (expanded as demand data arrives): Variable A, target industries: Fintech
and Microfinance, E-commerce and Retail, EdTech and School Portals, Logistics and
Q-Commerce, and the other industries in the catalogue. Variable B, tech stack or service:
Mobile App Development (Flutter or React Native), Custom Web App Development, UI and
UX Product Design, API Integrations (Mono, Flutterwave, Paystack), and the rest of the
service catalogue. Variable C, Nigerian hubs: Lagos (Ikeja, Lekki, Yaba), Abuja (Wuse,
Garki), Port Harcourt, Ibadan, Enugu, Kano, plus a budget or constraint axis where demand
justifies it.
This complements the service-and-industry combinations in Section 9.4 and the
transactional templates in Section 9.5; together they form one permutation space governed
by the same gate, not three separate efforts.
High content uniqueness: a substantial portion of the text and data on any given page must
vary significantly from every other page in the same set. Two pages in the permutation
space never read as near-duplicates. The page is built so that the localized facts, the data
blocks, the matrix values, and the proof are genuinely different per variation, not a single
template with three words swapped.
Modern AI layering (not standard text templates): instead of filling a fixed text template, the
generation pipeline uses AI to synthesize the localized information, summarize the specific
data blocks, and generate distinct comparative insights tailored to each variation. For
example, the opening paragraph is synthesized to speak to the real local infrastructure
reality (such as optimising for low-bandwidth mobile networks in Port Harcourt), the data
blocks are summarized from the real sources for that permutation, and the comparative
insight is generated for that exact industry, stack, and place. Every AI-layered block is
grounded in real data, obeys the house voice (plain spoken English, no em dashes, no
buzzwords, jargon, or cliches), and is reviewed and approved by a person before publish.
Clean internal linking and crawlable hierarchy: Google must see clear, logical categorical
hierarchies to crawl thousands of pages, so no variation page is ever left orphaned. Every
permutation page links up to its parent service or industry hub and is linked down to from a
hub or index that lists its set, so there is always a crawl path in and out. Hub pages group
the permutations by industry, by service, and by location so the hierarchy is explicit. The split
programmatic sitemap lists every published permutation. Breadcrumbs reflect the hierarchy
on every page. Variation pages are never buried without inbound links.
The non-penalizable agency template (the page blueprint each permutation renders):
H1: Custom [Tech Stack] Development for [Industry] in [Location]
[Dynamic AI summary paragraph]: synthesized to the local infrastructure
reality, for example "Optimized for low-bandwidth mobile networks in
Port Harcourt", grounded in real data for this permutation.
[Core feature matrix table]: the genuinely relevant capabilities for this
industry and stack, for example offline-first capability and the local
payment gateways (Paystack, Flutterwave, Interswitch), with honest values
per row rather than the same row on every page.
[Dynamic portfolio widget]: real past projects for this industry or an
adjacent one, pulled from the case-study data, rendering nothing if no
real project exists rather than inventing one.
[Localized social proof]: industry-specific and location-specific proof
(a real testimonial or metric tagged to that industry or place) injected
dynamically, rendering nothing when no real proof exists.
[CTA and interactive brief builder]: "Get an instant estimate for your
[Industry] project in [Location]", routing into the Solution Finder and
the CRM lead intake.
The portfolio widget and the social-proof block follow the no-fabrication rule absolutely: they
inject only real, tagged proof and never an invented project or review. Because client-specific
industry proof will not exist for most permutations at launch, the proof area never renders
empty and never fabricates. Instead it fills from a substitution ladder, taking the highest tier
available for that page and clearly labelling what each item is: First, real client proof tagged
to that exact industry or location, when it exists. Then, real client proof from an adjacent
industry, labelled honestly as adjacent ("a logistics project with similar requirements"). Then,
the in-house builds: Covyvo (payroll and e-invoicing for Nigerian SMEs) and GLEEN (exam
preparation), presented as real Nexoris Technologies products with outbound links, which
are genuine first-hand proof of capability even before client case studies exist. Then,
capability and process proof that is true on day one: the concrete stack and approach for this
work, the local-fit specifics (offline-first, the named local payment gateways, the relevant
compliance), and the written-scope and ownership commitments, presented as what we do
rather than as a client result. The ladder means every page carries genuine, honest
credibility from launch without waiting on reviews and without ever inventing a client
outcome. As real tagged proof is added over time, it automatically replaces the lower tiers on
the relevant pages.
9.7 Programmatic SEO quality gate to avoid a Google penalty
(non-negotiable)
These rules are non-negotiable and gate every programmatic page, including every
permutation page from Section 9.6, before it can publish. They exist because programmatic
pages at scale are exactly what Google's spam and helpful-content systems penalise when
they are thin, templated, or duplicative. A page that fails any rule below stays unpublished.
Every page is genuinely unique and helpful, written for a person trying to solve a real
problem, not assembled to fill a slot. The more-than-half-unique rule still applies: more than
half of a page's content must be unique to that page, or the query is answered by the parent
page instead. EEAT is implemented on every programmatic page: a named author and
where relevant a fact-checker with real profiles, the Nexoris Technologies entity signals,
honest first-hand expertise in the copy, and citations or sources for any claim or statistic.
Location-based pages (cost, hire, and city pages, and any service or industry page tied to a
place) must have a genuinely distinct structure and genuinely distinct data per page, never a
single template with the city name swapped. Each location page uses data points specific to
that place, for example local market statistics, local pricing tables in Naira, local demand or
adoption figures, and local context, so that two location pages never read as
near-duplicates. Every programmatic page draws on three or more distinct data sources, or
combines public data with proprietary Nexoris Technologies insight (project data,
anonymised client outcomes, or genuine user reviews and observations), so the page
carries information that exists nowhere else in that combination. Every page is structured to
satisfy the searcher's intent in depth: where the intent is comparison, the page provides a
real comparison matrix with honest trade-offs; where the intent is cost, a real pricing table
with the factors that move the number; where the intent is capability, the actual functionality,
scope, and process, not a thin summary. Surface-level coverage does not pass. A page that
cannot meet all of the above with real, distinct substance is not published. The layer is
gardened, not just planted: pages that earn no impressions after two quarters are improved,
merged into a parent, or redirected.
The data-readiness gate (the system holds pages back; it does not depend on anyone
moving fast). The permutation layer is unpublished by default. A page becomes eligible to
publish only when its data-readiness record is complete: its three or more distinct data
sources are attached, its local data points are present and genuinely specific to that
permutation, its feature matrix has honest per-page values, and its proof area resolves to at
least the in-house or capability tier of the ladder above. Until that record is complete the
page stays a draft, and no amount of generation moves it forward. This makes the safe path
the default path: the constraint is data readiness, enforced by the system, not publishing
speed enforced by a person. The launch wave is therefore deliberately small and high
quality. Rather than a large set of near-empty pages, the first wave is roughly 10 to 20
permutation pages for the industries and locations where real, distinct data already exists
(starting from the in-house products and the strongest researched local data), each one
genuinely complete. The layer then grows one ready page at a time as data is added, and a
simple readiness dashboard shows which permutations are data-complete and which are
still waiting, so expansion is paced by real substance rather than a target page count. There
is no deadline pressure on proof: a permutation simply waits, fully unpublished and invisible
to search, until it is genuinely ready.
9.8 Winning AI Overviews and AI citations (GEO)
Every commercial page leads with a direct, quotable answer to its core question in the first
80 words, then expands. FAQ sections are written as real questions with self-contained
answers, marked up as FAQPage, so each answer can be cited on its own. Original data is
the citation magnet: a yearly report built from project data and a simple survey, published on
Insights. Entity building: consistent Organization schema, profiles on the directories AI
engines trust, consistent name, address, and phone everywhere, and authored Insights
pieces with real author profiles. llms.txt at the root summarises who Nexoris Technologies is,
every service, every industry, and the contact path, for machine readers. Quarterly tracking
of where Nexoris Technologies appears across ChatGPT, Perplexity, and Google AI
Overviews for the 50 target commercial queries, with gaps feeding the content plan and
results published on /ai-seo-geo.
9.9 Google sitelinks eligibility
The flat structure keeps every service and industry page one click from the homepage
through the mega-flyouts, and no page is more than two clicks from any other. The
homepage carries a clear H1, a branded meta title, and four service category cards linking to
every service. Navigation, footer, and body anchor text match target page H1s and meta
titles closely. Every page title ends with the Nexoris Technologies brand. The WebSite
SearchAction enables the sitelinks searchbox once the domain qualifies. BreadcrumbList on
every internal page supports the hierarchy signal. Programmatic drafts that have not cleared
the quality gates carry noindex so Google never indexes an unready page. What cannot be
forced is stated plainly: sitelinks appear automatically based on authority, branded click
behaviour, and time; the implementation makes the site eligible and the entity-building work
accelerates the authority signal.
9.10 Core Web Vitals and Lighthouse targets
Lighthouse 95 or above on the four sampled page classes (Home, one service, one industry,
one Insights article), mobile and throttled. Core Web Vitals in the green. A Lighthouse CI
budget check blocks any merge that regresses these targets. Hardcoded pages are static;
fonts are self-hosted variable woff2 with font-display swap and size-adjusted fallbacks so
nothing shifts on load; all raster images are WebP or AVIF with explicit width and height,
hero preloaded and the rest lazy; JavaScript is minimal on content pages, with the Oge
widget and Solution Finder hydrated without blocking render; animation is off under
prefers-reduced-motion.
9.11 The SEO automation gate (check:seo)
A CI gate runs on every pull request across every route. It checks: canonical present and
correct; meta title within 60 characters; meta description between 155 and 160 characters
(160 the hard maximum); one unique H1; correct noindex only where intended; sitemap
inclusion matching the noindex flag; complete OG tags; at least one JSON-LD block present
and parseable; the required schema nodes per route class; BreadcrumbList on every
non-home page; FAQPage present wherever an FAQ section exists and absent otherwise;
inLanguage en-NG; addressCountry NG; og:url equal to the canonical; and no duplicate
slugs. A failure blocks the merge. Built before any page exists so every page is born
validating.
10. Oge AI: grounding, speed, and efficiency
All AI runs server-side in apps/oge. The architecture separates into two independent tiers:
the Website Bot serving visitors, and the CRM Worker serving the sales-team backend.
Each tier has its own primary model and a two-level fallback chain so no visitor or
salesperson ever sees a broken AI feature. Both tiers are grounded only in the Nexoris
Technologies knowledge base and cannot hallucinate. Oge speaks English only.
Two non-negotiables govern both tiers: the AI answers only from the knowledge base, and
calls are minimised through caching and deterministic logic so the system stays inside free
tier limits and stays fast.
10.1 Two-tier model architecture
Tier 1, Website Bot (serving nexoristech.com visitors). Goal: fast token-streaming latency,
resilient minute-by-minute rate handling, and a friendly tone. Primary: Google AI Studio
(Project A), Gemini Flash-Lite class, a lightweight chat-triage model that maps
customer-service intents cleanly and carries the structural rules in its system prompt. Backup
1: Groq, Llama 3.1 8B Instant class, optimised for short, snappy replies, activated by the
fallback block when the primary hits a limit, with the split invisible to the visitor. Backup 2:
SambaNova Cloud, an open mid-size instruct model, the second-tier website fallback for
deeper technical questions, insulating the chat against a provider outage.
Tier 2, CRM Worker (serving the admin dashboard CRM module in apps/admin, backend
workflows only). Goal: deep context handling, strong structured-output reliability, and
flawless JSON for automations. Primary: Google AI Studio (Project B, a separate Google
Cloud project from Project A so the daily quota is independent), Gemini Flash class with a
large context window, the workforce model for scoring leads and drafting. Backup 1: Groq,
Llama 70B Versatile class, tuned for structural analysis and tool use, good at returning a
rigid validated JSON block for CRM fields. Backup 2: Groq or SambaNova, a large open
model for long-form reading comprehension, used when the CRM needs a fallback engine to
read detailed technical requirements and craft a well-written outreach draft.
Configuration: all model identifiers are pinned in apps/oge/src/config/models.ts under
WEBSITE_BOT_MODELS and CRM_WORKER_MODELS. Verify the current
provider-specific model string for each entry against the official API documentation before
pinning. Environment keys required: GEMINI_API_KEY_PROJECT_A (website bot),
GEMINI_API_KEY_PROJECT_B (CRM worker), GROQ_API_KEY, and
SAMBANOVA_API_KEY.
10.2 Fallback chains
Before any model is called, the two cache layers run. A cache hit costs zero model calls.
Only on a cache miss does the generative chain start.
Website Bot chain:
callWebsiteBot(prompt, context):
hit = exactMatchCache.get(normalise(prompt)); if hit: return hit
emb = embedQuery(prompt) // cheap embedding
sem = semanticCache.find(emb, threshold=0.92); if sem: return sem
try: r = geminiFlashLite(prompt, context); cache(r); return r // Primary
catch RateLimit | Unavailable:
try: r = groqLlama8b(prompt, context); cache(r); return r // Backup 1
catch RateLimit | Unavailable:
try: r = sambanovaInstruct(prompt, context); cache(r); return r // Backup 2
catch AnyError:
return extractiveFallbackWithHandoff(prompt, context)
extractiveFallbackWithHandoff returns the most relevant retrieved chunk as a direct
quotation, then shows the contact panel (WhatsApp and contact form) with: "I am having
trouble generating a full response right now. Here is what I found, and the team can help you
with anything beyond this." No error codes or technical language reach the visitor.
CRM Worker chain:
callCrmWorker(prompt, context, schema?):
try: r = geminiFlash(prompt, context, schema); return validate(r, schema) // Primary
(Project B)
catch RateLimit | Unavailable:
try: r = groqLlama70b(prompt, context, schema); return validate(r, schema) // Backup 1
catch RateLimit | Unavailable:
try: r = largeOpenModel(prompt, context, schema); return validate(r, schema) // Backup 2
catch AnyError:
jobQueue.add({prompt, context, schema, retryAt: now()+5min})
return { status: 'queued', fallback: ruleBasedScore(context) }
JSON schema validation runs on every CRM response where structured output is expected
(scoring, service tagging, deduplication). Malformed JSON is treated as a service error and
falls to the next slot.
10.3 The knowledge base (grounding)
packages/kb produces one canonical knowledge base from the hardcoded marketing
content modules (at web build time) plus published Strapi Insights, legal, and pSEO content
(on each publish webhook). Catalogue facts (services, industries, process, contact details)
are included so both tiers have the full picture. Content is chunked (about 800 tokens, 100
token overlap, never splitting an FAQ pair or an answer-block), embedded once with the
embedding model, and stored in pgvector in nexoris_oge, each chunk carrying its source
URL. Both tiers retrieve from the same index. Strict grounding contract: both tiers answer
only from retrieved chunks. The system prompt forbids outside knowledge, requires a plain "I
do not have that detail" on empty retrieval, and forbids inventing prices, timelines, client
names, or results. For any number, a tier states only what a retrieved chunk contains, and
when an answer comes from a page it names and links that page. Re-ingestion is
incremental: a publish updates only the affected chunks; a delete removes them in the same
webhook. A full rebuild command exists for releases.
10.4 Reducing model calls and staying fast
Deterministic before generative: the Solution Finder mapping and lead service-tagging use a
versioned mapping.json derived from the cross-linking matrix; models write only short
rationale text. Routing, scoring rules, and the intent enum are code, not model calls,
wherever a rule suffices. Exact-match cache: common questions are answered from a cache
keyed by a normalised query hash plus knowledge-base version, pre-warmed at deploy and
grown from Oge's gap report. A hit costs zero model calls. Semantic cache: before any
generation, the prompt is embedded and compared to recent prompt embeddings; a cosine
match above threshold returns the cached answer, catching paraphrases. Embedding is far
cheaper than generation, and chunk embeddings are computed once at ingestion. Local
retrieval: vector plus Meilisearch keyword retrieval runs entirely in our infrastructure. Only the
final grounded synthesis is a model call, with context capped (about 4k tokens for the
website bot) to keep each call small and fast. Batch and schedule: Insights helpers, meta
drafts, programmatic first drafts, and CRM digests run in scheduled batches at publish or
off-peak, never on a visitor request, and on the CRM Worker tier so the website bot quota
stays free for visitors. Debounce live features: the smart form assistant fires at a pause in
typing, after a minimum character count, at most once every few seconds per session,
prefers a deterministic keyword hint, and calls the bot only when the text is substantial.
Quota governor per provider: per-session and per-IP limits at apps/oge, input capped at
2,000 characters, a token-bucket per provider, batch jobs queuing first as a bucket nears its
limit so interactive chat stays up longest.
10.5 Website AI features (all grounded, website bot tier, English)
Oge assistant on all pages: a floating button bottom-right, one gentle first-visit pulse, labelled
"Chat with Nexoris Technologies" for screen readers. RAG over the knowledge base,
English, declines off-topic in one sentence, streams over SSE, names and links sources. Up
to three gentle qualifying questions, then a handoff: book a call, WhatsApp, or email the
transcript to business@nexoristech.com. Oge lead capture to CRM: on a readiness signal,
Oge collects name, contact, and brief in conversation, confirms on screen, and submits to
CRM intake with the transcript, intent tag, and pages discussed. Scored on arrival. Nothing
sends without confirmation. Solution Finder: five questions (industry, biggest current
headache, company size, urgency, optional budget range), deterministic mapping to one to
three services and an industry page, the model writing only the short rationale under a strict
JSON schema so it can never name a page that does not exist. Entry points: the Services
flyout featured panel, the Home solution-finder section, and the ghost CTA on every service
and industry page. Smart form assistant on Contact: as the visitor types their brief, a
debounced one-sentence hint reflects what they seem to need and which service likely fits.
Falls back silently to a deterministic keyword hint if the bot is unavailable. Instant
personalised acknowledgement on Contact submit: a few-second reply with their name, the
team best placed to help, and three plain bullets of what an initial conversation explores.
Falls back to a warm template that still names the matched service and the
one-business-day promise. AI search on Insights and global: natural-language search
returning the right pages and articles with a one-line grounded answer above results, served
from cache and retrieval where possible. Personalisation, consent-gated: after cookie
consent, a returning visitor who spent time on an industry page sees that industry surfaced
first in the Home grid and a CTA line tuned to their sector. Without consent, everyone sees
the same site. Phase-two candidates: an automation savings calculator on
/business-process-automation, cost calculators on the pricing pages, a no-show cost
calculator on /healthcare-software and /fitness-wellness-software, a direct-booking
commission calculator on /hospitality-software.
10.6 The Oge system prompt (used verbatim, parameterised)
You are Oge, the assistant on the Nexoris Technologies website.
- Answer ONLY from the provided context about Nexoris Technologies. If the context does
not contain the answer, say plainly that you do not have that detail and offer to connect
the visitor with the team.
- Never invent prices, timelines, client names, metrics, or capabilities. If asked about
cost, explain that every project gets a written scope with honest numbers, and offer the
scoping call.
- Reply in English. Use plain words, complete sentences, short paragraphs. Never use an
em
dash. Never use buzzwords, jargon, or cliches. Always write "Nexoris Technologies" in full.
- Ask at most three short questions before suggesting a service and offering a handoff
(book a call, WhatsApp, or email the conversation to the team).
- For anything sensitive, legal, medical, or unrelated to Nexoris Technologies, decline
in one polite sentence and steer back.
- When an answer comes from a specific page, name it and include its link.
Context:
{retrieved_chunks_with_source_urls}
10.7 AI acceptance tests
"How much is a website" returns no invented figure, explains the written-scope approach,
and offers the call, across all three website bot slots in isolation. An off-topic request such as
"write me a poem" gets a one-sentence decline and a redirect. A published Insights article is
retrievable in chat within a minute of publishing. With Project A unavailable, the Groq backup
answers correctly; with Groq also down, SambaNova answers; with all three down, the
extractive fallback and handoff panel appear, and no stack trace reaches the UI at any point.
Two paraphrased common questions in one session produce one generation call at most
(semantic cache hit on the second). Solution Finder for (Healthcare, missed appointments,
200 staff, ASAP) recommends Chatbots and Virtual Assistants plus /healthcare-software,
valid JSON, real URLs, and runs correctly from the backups too. CRM Worker scoring
returns a band and a plain-language justification; when Project B is down, Backup 1 returns
a valid JSON score block.
11. Lead capture and the admin dashboard CRM
contract
The website is the primary lead source. Three paths, one destination. Paths: the Contact
form posts to CRM intake on submit; Oge captures conversationally with the transcript
attached; the Solution Finder posts a lead on "Email me this" or "Book a call" with the five
answers and the recommendation shown. What every lead carries: source, originating page
(including which programmatic or cost page, so that layer's revenue is measurable), UTM
data, the full message or transcript, structured Solution Finder answers where present, and
the lead score with its justification. Scoring contract: every lead is scored 1 to 100 on arrival
via the CRM Worker tier against the ideal customer profiles, intent signals, and
completeness, returned with a clear plain-language justification and a Hot, Warm, or Cold
band. If generative scoring cannot run live, the rules-based component produces a baseline
immediately so the lead is never unscored, and full scoring runs when capacity returns.
Boundaries: the website does not assign or reassign leads and does not display the admin
dashboard. The admin dashboard CRM module owns assignment, stages, and sending. The
website's responsibility ends at a scored, fully contextual lead delivered to intake.
12. Pages and behaviour (marketing pages)
Every page's H1, sections, hero subline, CTAs, and meta are approved in the Website Copy
and are not restated or changed here. The 33 hardcoded marketing pages are statically
generated, with ISR only where they pull proof from the content API. Oge floats on all of
them. The Solution Finder appears on Home and as the ghost CTA on every service and
industry page. The header carries the flyouts and the Company dropdown exactly as Section
7 specifies, keyboard-operable per Section 15. Contact carries the lead-capture features
(Section 10.5 and Section 11). Home section behaviour: a dark hero with a soft radial purple
glow and a trust strip; a three-card pain section; the embedded Solution Finder; four broad
service category cards with sub-service links rather than all 11; a six-stage process strip
linking to /how-we-work; a filterable 20-tile industries grid that is the anchor target for the
footer link; a proof band of verified metrics only plus two featured case study cards from the
content API; a four-card "what working with us is like" section; the AI-approach block; a
testimonials carousel from the content API; the latest three Insights articles from the content
API; and the closing CTA band with the one-business-day promise. Service pages (11) follow
this section order: hero, pain, scope, ai-where-it-helps (named clearly as optional additions),
process, proof, industries-links, faq with FAQPage schema, cta-band. For services that are
AI by nature (chatbots, SEO and GEO), the AI section is the service itself, not an optional
block. Industry pages (20) follow this section order: hero, pain, solutions, ai-where-it-helps
(the closing line always makes the optional nature clear), outcomes, services-links, proof,
faq with FAQPage schema, cta-band. Case study detail template (/case-studies/[slug]): hero
(client, industry, headline result), "Where they started", "What we agreed to build", "How it
went", "What changed" (verified metrics grid only), the client quote, related services and
industry links, and a CTA band. An optional "AI we added" block appears only where AI
features were part of the build.
13. Mobile floating table-of-contents menu
Insights articles and legal pages are long and structured, so on mobile widths only they get a
floating navigation aid; the marketing pages do not. A small floating button sits bottom-left
(never overlapping Oge bottom-right), labelled "Jump to a section". Tapping it opens a
drawer listing every section as a tappable item, using the short AI-generated titles described
in Part Two so the list stays neat. Tapping an item scrolls to that section and closes the
drawer; the current section is highlighted as the visitor scrolls. It is a real disclosure widget:
focus is trapped while open, Escape closes it and returns focus to the button, and it honours
prefers-reduced-motion with an instant jump instead of a smooth scroll.
14. Design system
The full token set lives in packages/config as the Tailwind brand preset and is enforced in
code review. The goal is a premium, calm, confident product where consistency does most
of the work. The system has three typographic contexts, because the site, the editorial
reading experience, and the dashboards each have different jobs.
14.1 Typography by context
All fonts are free, available as variable woff2, self-hosted, with font-display swap and
size-adjusted fallbacks so nothing shifts on load.
Marketing pages (the public site chrome and section content): Hero headline: Plus Jakarta
Sans, weight 700. Feature subheads and section headings: Plus Jakarta Sans, weight 600
to 700. Feature body and supporting copy: Inter, weight 400 to 500.
Articles (Insights reading experience): Article category and meta line: Inter, weight 500.
Article headline: Lora, weight 600 to 700. Body paragraphs: Lora, weight 400, the serif
chosen for long-form reading comfort.
Dashboards (CMS admin surfaces and the internal admin dashboard, including its CRM
module): Dashboard titles and section headings: Inter, weight 600 to 700. Table headers:
Inter, weight 600. Data points and body: Inter, weight 400 to 500. API codes and IDs:
JetBrains Mono, weight 400 to 500.
Declared fallbacks: Plus Jakarta Sans to ui-sans-serif, Inter to system-ui, Lora to Georgia
and ui-serif, JetBrains Mono to ui-monospace.
14.2 Responsive type scales (fluid, using clamp, all rem)
Marketing pages: Hero headline: clamp(2.125rem, 1.55rem + 2.6vw, 4rem), line-height 1.1,
tracking -0.02em. Section heading: clamp(1.625rem, 1.3rem + 1.5vw, 2.5rem), line-height
1.2, tracking -0.01em. Feature subhead: clamp(1.25rem, 1.1rem + 0.7vw, 1.75rem),
line-height 1.3. Feature body: clamp(1rem, 0.96rem + 0.2vw, 1.125rem), line-height 1.65.
Small and labels: 0.875rem, line-height 1.4.
Articles: Article headline (H1): clamp(2rem, 1.5rem + 2.2vw, 3rem), line-height 1.2, tracking
-0.01em. Article H2: clamp(1.5rem, 1.25rem + 1vw, 2rem), line-height 1.25. Article H3:
clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem), line-height 1.3. Body paragraph:
clamp(1.0625rem, 1rem + 0.25vw, 1.25rem), line-height 1.75, the generous measure that
makes long reading comfortable. Category eyebrow: 0.8125rem, tracking 0.06em,
uppercase. Maximum line length 68 characters on article body.
Dashboards (CMS and the internal admin dashboard): Dashboard title: clamp(1.5rem,
1.3rem + 0.8vw, 1.875rem), line-height 1.2. Section heading: 1.25rem, line-height 1.3. Table
header: 0.8125rem, weight 600, tracking 0.02em. Data point and body: 0.875rem to 1rem,
line-height 1.5. API code and ID: 0.875rem, JetBrains Mono.
All sizes in rem so user font-size settings are respected and layouts hold at 200% browser
zoom.
14.3 Spacing
A single 4px-based scale used everywhere, no arbitrary values: 4, 8, 12, 16, 24, 32, 48, 64,
96, 120. Section padding 120px desktop and 64px mobile. Consistent vertical rhythm is most
of the premium feel.
14.4 Shadows and radius
One restrained, layered shadow system tinted with purple at about 4% opacity rather than
grey, in three steps only: subtle for cards, medium for popovers and the Oge panel,
prominent for modals and the mobile TOC drawer. No hard black drop shadows. Card radius
12px throughout.
14.5 Colour system around #543CDA, with verified contrast
Purple is the voltage, not the wallpaper. Roughly 80% neutral surfaces, 15% ink, 5% purple.
One purple element per viewport. The eye should always know what to press. purple-600
(primary) #543CDA: primary buttons, links, active states, key icons. White text on it 6.9:1,
passes AA at every text size; as text or icons on white 6.9:1, passes AA. purple-700
#4330B8: hover and pressed states. White on it 9.3:1, passes AAA. purple-500 #6A55F2:
gradient partner, focus rings, chart accents on dark. Decorative and large elements only on
light backgrounds. purple-100 #EEEBFC: tinted section backgrounds, tag pills. Ink-950 text
on it above 17:1. purple-200 #DCD6F9: borders and dividers on tinted surfaces. Decorative.
ink-950 #0D0A1C: hero and footer backgrounds, headline text on light. White on it 19.5:1.
ink-800 #1C1438: cards and secondary surfaces on dark sections. White on it above 15:1.
neutral-50 #FAFAFC: default page background. neutral-600 #555269: secondary text on
light, a violet-tinted grey. On white 7.2:1, passes AA comfortably. mint-400 #2EE6A8:
success states and live metrics, dark surfaces only. On ink-950 12:1. Never used as text on
white, where it would fail, and never the only carrier of meaning. white #FFFFFF: text on
purple and ink.
14.6 Colour usage principles
Dark hero, light body: key pages open on ink-950 with a soft radial purple glow behind the
headline (gradient #6A55F2 to #543CDA at 15 to 25% opacity, blurred), then drop into light
sections. One purple element per viewport; if two things compete, demote one. Gradients
live on dark surfaces and buttons only, never gradient text on light backgrounds. The
signature motion is a thin purple line that traces along section dividers as the page scrolls,
the one motion idea on the site, subtle, and off entirely under prefers-reduced-motion.
Photography is real people and real environments, slightly desaturated with a cool grade so
the purple stays the loudest colour in every frame.
14.7 Responsiveness down to 280px
The site and all dashboards are usable and correct down to 280px width, with no horizontal
overflow and no clipped content. Rules: never set a fixed pixel width that exceeds the
viewport; use fluid widths, max-width, and min-width 0 on flex and grid children so they can
shrink; long text and IDs wrap or truncate with an accessible tooltip; images and media are
responsive and never overflow their container; modals and sheets become full-screen or
bottom sheets on the smallest screens; tap targets stay at least 44 by 44 pixels. Every
screen is tested at 280, 320, 360, 414, 768, 1024, and 1440 before it is marked done.
14.8 Responsive tables (frontend and dashboards)
Tables must never break the page width. On wide screens they render as standard tables
with sticky headers where useful. Below the medium breakpoint they switch to one of two
patterns chosen per table: a stacked-card layout where each row becomes a labelled card
(label and value pairs), or a horizontally scrollable container with a visible scroll affordance
and a frozen first column. Numeric and money columns use JetBrains Mono and right-align.
Article body tables (rendered from CMS content) use the stacked-card pattern on small
screens so they stay readable at 280px. Every table has a caption or accessible name,
proper header cells with scope, and a row count announced to assistive technology.
14.9 Favicon and shared brand assets
One favicon and icon set, generated from the Nexoris Technologies logo, is used across all
three surfaces: the website, the internal admin dashboard (including its CRM module), and
the CMS admin. The same favicon.svg, favicon.ico, the 192px and 512px manifest icons,
and the apple-touch icon are shared so the brand reads consistently in every browser tab
whether a person is on the public site, signed into the admin dashboard, or editing in Strapi.
The assets are built once and stored in packages/brand and referenced by apps/web,
apps/admin, and the Strapi admin.
15. Accessibility
WCAG 2.2 AA is the floor, not the ceiling. The html element carries lang="en-NG" on every
page. One H1 per page, proper landmarks (header, main, nav, footer, aside), headings in
order with no skipped levels. Every text and interactive colour combination meets 4.5:1
minimum, 3:1 for large text, with the ratios in Section 14.5 re-verified whenever a token
changes. Colour never carries meaning alone: status uses an icon plus a label. Full
keyboard operability: a skip-to-content link first in the DOM, logical tab order, a visible 2px
purple-500 focus ring with 2px offset on every interactive element, flyouts that open with
Enter or Down Arrow and close with Escape with focus returning to the trigger, and the
mobile TOC drawer that traps focus and closes with Escape. Mega-flyouts and the mobile
TOC are real disclosure widgets with aria-expanded, never CSS-only. The Oge panel is
announced to screen readers, traps focus while open, and announces streamed text politely
via aria-live. Forms: every field has a visible label above it, errors in plain language beside
the field they describe and announced via aria-live, and placeholder text is never used as a
label. Touch targets at least 44 by 44 pixels. Every meaningful image carries written alt text;
decorative images carry empty alt. Motion honours prefers-reduced-motion. Layout holds at
200% zoom and down to 280px width. check:a11y runs axe-core across every route in CI
and fails on any serious or critical issue; manual NVDA and VoiceOver passes happen
before launch and after every major release. No accessibility item is deferred.
16. Image handling (VPS storage, WebP, no CDN)
All files and images are stored on the VPS filesystem and served directly from the VPS.
There is no CDN. The system, including the CMS, converts and renders all images in WebP.
Editors may upload JPG or PNG and the pipeline converts to WebP (with AVIF offered
where the browser supports it and WebP as the floor) using a Sharp-based step at upload,
generating responsive variants once and caching them on disk. next/image is configured to
serve the VPS-hosted WebP variants with explicit width and height so there is no layout
shift, lazy loading below the fold, and hero preloaded. Targets: hero images under 120KB,
card thumbnails under 40KB. Logos, icons, and the section-divider signature ship as SVG.
The single documented exception to WebP is the OG social card, generated server-side at
1200x630px and served as PNG because that is the format social platforms render reliably.
Alt text is a required field in Strapi for any image attached to published content, and all
meaningful hardcoded images carry written alt text in the content module.
PART TWO: THE CMS (Strapi)
1. Role and scope
The CMS is Strapi v5 on PostgreSQL (nexoris_cms). It powers only what changes often or
must be edited without a deploy: the Insights hub and articles, author profiles, the careers
hub and job openings, the three legal pages, the proof data shown on hardcoded pages, and
the programmatic-page drafts. Everything else on the marketing site is hardcoded (Part One,
Section 6). Editors work entirely in Strapi; they never touch code. Every AI helper in this part
produces a draft the editor can review and change before publish, and nothing in the output
reveals that it was AI-generated. The output tone is spoken word, the way a knowledgeable
person explains things, with no em dashes, jargon, cliches, or buzzwords.
2. Content types
2.1 Collection types
insight (the article): title, slug, public URL path (read-only, computed, Section 12), excerpt,
body (rich blocks), category (an enum used for filter tabs, not a separate page), author
relation, fact-checker relation (an author in a different role), cover image (required, with alt
text, used on the article hero, the Insights cards, the homepage Insights section, the OG
card, and the schema primary image), TL;DR bullets (AI-drafted, editor-approved), FAQ
items (AI-drafted, editor-approved, 5 to 7), table-of-contents short titles (AI-drafted per H2),
recommended reads (three article relations, AI-suggested, editor-approved), internal-link
suggestions (a list the editor accepts or rejects, Section 9.6), reading time, featured flag,
index or de-index flag (Section 12.1), seo component, published date, updated date. author:
name, slug, photo (the passport image used in the bio box and as the link to the profile), role
tags (up to three interchangeable roles, Section 5), short human-written biography,
per-article AI-generated bio is stored on the article relation not here (Section 4.3), LinkedIn
URL, other sameAs links, areas of expertise (knowsAbout), seo component. category: name,
slug-safe key, description. Used only to drive the Insights filter tabs and the articleSection
schema value. Categories do not create their own URL paths. job (careers): department,
position title, slug, public URL path (read-only), cover image (required, with alt text, used on
the careers hub card, the job page hero, the OG card, and the schema image), location,
employment type, the job description (rich blocks), responsibilities, requirements, the
application form configuration (which fields show, including the portfolio or GitHub link
option), open or closed status, posted date, seo component. pseo-page: template type
(combination, cost, comparison, location, or article-derived), slug, public URL path
(read-only), H1, answer-block (the quotable opening for GEO), unique content blocks, price
ranges where relevant, FAQs, the quality-gate checklist (demand verified, fit verified,
substance verified, unique-and-helpful confirmed, EEAT in place with named author and
sources, three-or-more distinct data sources cited, and for location pages a distinct structure
and distinct local data confirmed, per Part One, Section 9.7), the data-readiness record (the
attached data sources, the per-permutation local data points, and the resolved proof tier, per
Part One, Section 9.7), the cited data sources, the resolved proof block (real tagged proof or
the highest available substitution-ladder tier, never empty, never fabricated), author and
optional fact-checker relations, source article relation where derived from an article (Section
10), publish status (unpublished by default until the data-readiness record is complete), seo
component, relations to parent service and industry.
2.2 Supporting proof types (served via the content API to hardcoded
pages)
case-study: client or product name, in-house flag, external product URL (for Covyvo and
GLEEN), industry tag, service tags, sections, verified metrics, quote, hero image, optional
"AI we added" block, seo component. testimonial: quote, person, role, company, industry and
service tags.
2.3 Single types
global (company details, address, phone, emails, social links, announcement bar),
navigation, footer, and the three legal pages: privacy-policy, terms-of-service, cookie-policy,
each as a single type with an ordered list of section and plain-summary pairs, a last-updated
date, and a seo component.
2.4 Shared components
seo (meta title with a live 60-character counter, meta description with a live counter targeting
155 to 160 characters with 160 the hard maximum, both AI-draftable and editor-editable, OG
image, canonical, noindex flag, schema type), metric, answer-block, price-range, faq-item,
toc-item (full H2 plus its short title), internal-link-suggestion (target URL, suggested anchor
text, rationale, accepted flag).
3. Insights listing page (the hub)
The Insights hub is the blog parent and the listing page for all articles. It is not split into
category pages. It carries: a hero with the approved H1 and subline; an AI-powered search
bar with the approved placeholder; category filter tabs that filter the listing in place without
changing the URL; a featured article driven by the editor-picked flag; the article card grid
(Section 3.1); a newsletter capture; and a CTA band. Filtering by a tab updates the visible
cards client-side and never produces a category URL. Article URLs are always flat at
/insights/[article-slug]; the category exists only as a filter and a schema value, never as a
path segment.
3.1 Article card structure
Every article card renders, in this order: the cover image (WebP, fixed aspect ratio so the
grid never shifts), the category eyebrow (Inter), the headline (Lora), a short excerpt of one to
two lines drawn from the article excerpt field and truncated cleanly with an ellipsis at the card
boundary, and a meta row with the author name and the published date in a readable format
(for example "12 June 2026"). Cards are equal height in the grid regardless of headline or
excerpt length, with the cover, headline, excerpt, and meta row aligned across the row. The
whole card is a single click target to the article, with a visible focus ring, and the cover
carries the article alt text.
3.2 Sorting and ordering
Articles sort by published date with the most recent first, both in the Insights collection and in
the homepage Insights section. The featured article, when set, shows in the featured slot;
the remaining cards still sort latest first. A draft never appears; only published articles list.
3.3 Pagination versus load more
The Insights collection uses a Load more button rather than numbered pagination. The
reasoning, recorded here as the chosen option: a Load more button keeps every article on
one canonical URL (/insights), which concentrates ranking signals and avoids the thin,
near-duplicate paginated URLs that numbered pagination creates; it reads as more premium
and is easier on mobile than tapping page numbers; and the first screen of latest cards
renders server-side for SEO and speed, with each Load more fetch appending the next set
without a full navigation. For very large archives the URL can carry an optional rel-next style
deep link for crawlers, but the default and visible experience is Load more.
3.4 Homepage Insights section
The homepage Insights section shows the latest three published articles, newest first, each
as the same card from Section 3.1 (cover, category, headline, excerpt, author, published
date), under the approved heading, with a link to the full Insights hub. It reads from the
cached content API so a new publish updates it without redeploying the homepage.
4. The article (post) page
This is the most carefully engineered page in the CMS, built to satisfy EEAT, the answer-first
approach, and generative engines, while reading like a knowledgeable person talking.
4.1 Structure top to bottom
Breadcrumb (Home, Insights, the article). Category eyebrow (Inter). Article headline H1
(Lora). The author and fact-checker snippet block directly below the title (Section 4.2). The
TL;DR summary box (Section 4.4). The auto-generated FAQ section placed in the top area
of the page for answer-first and generative-engine value (Section 4.5). The article body
(Lora), with the answer-first opening so the first 80 words directly answer the article's core
question. A sticky desktop table of contents built from the short AI titles (Section 4.6). One
contextual mid-article CTA matched to the category. The full author bio box with the passport
linking to the author page. Three recommended reads (Section 4.7). A newsletter capture. A
CTA band. On mobile, the floating TOC drawer from Part One, Section 13.
4.2 Author and fact-checker snippet (EEAT)
Directly below the title sits a compact, well-designed credibility block showing both the
author and the fact-checker, each with their name, their role on this article, a short bio line, a
LinkedIn icon linking to their profile, and their passport photo. Clicking the passport opens
that person's author page (/authors/[slug]). The fact-checker is a second author in the
fact-checker role for this article. Both are marked up in schema (author and reviewer,
Section 11) so the credibility signal is machine-readable.
4.3 Per-article AI author bio (EEAT)
For each article, the author's bio shown in the bio box and the snippet is auto-generated
from the author's profile so it aligns with the specific article content, strengthening the
topical-authority signal that EEAT rewards. The generation reads the author's stored profile
and expertise plus the article topic and writes a short, natural bio that connects this author to
this subject. It never states or implies that it was AI-written, reads as spoken word, and uses
no em dashes, jargon, cliches, or buzzwords. The editor reviews and can edit it before
publish. The human-written biography on the author record remains the fallback and the
basis for the author page.
4.4 TL;DR summary box (premium styled)
A premium styled box near the top gives the short version of the article for readers who want
the gist first. It is AI-generated from the article body, presented in spoken-word tone, with no
sign that it was AI-written, and no em dashes, jargon, cliches, or buzzwords. The editor
approves or edits it before publish. This doubles as strong answer-first material for AI
Overviews.
4.5 Auto-generated FAQ section (5 to 7)
Each article auto-generates a styled FAQ section of five to seven questions placed in the top
area of the page, written as real questions with self-contained answers so generative
engines and AI Overviews can cite each answer on its own. AI drafts them from the article;
the editor approves or edits. The section emits FAQPage schema (Section 11). Answers
read like a knowledgeable person talking, with the same voice rules.
4.6 Table of contents with short titles
The TOC uses only short titles, an AI-generated short version of each H2, so the list stays
neat on both the sticky desktop TOC and the mobile drawer. Each TOC item stores the full
H2 (for the anchor) and the short title (for display). The editor can edit any short title. Clicking
an item scrolls to the section.
4.7 Recommended reads
Below the article, three other articles are recommended. AI suggests them by topical
similarity and complementary intent; the editor can swap any of the three. Each renders as a
card with cover, category, headline, and reading time.
5. Author page and roles
Each author has a profile page at /authors/[slug] showing their photo, name, roles,
human-written biography, areas of expertise, and LinkedIn and other links, followed by the
articles they wrote and the articles they fact-checked, clearly separated. Each author can
hold up to three interchangeable roles (for example author, fact-checker, and editor), and the
same person can be the author of one article and the fact-checker of another. The page
emits ProfilePage and Person schema (Section 11) with sameAs the LinkedIn profile, which
is a direct EEAT signal. The passport photo in any article bio box links here.
6. Careers
The careers hub at /careers comes from Strapi and lists all current openings, filterable by
team, with the approved empty state when nothing is open. Each opening has its own page
at /careers/[slug] showing the department, the position being recruited for, the full job
description, the responsibilities and requirements, and an application form. The application
form includes the standard fields plus an option for a portfolio or GitHub link. Submissions
route to the appropriate inbox and, where useful, into the admin dashboard CRM module as
a candidate record kept separate from sales leads. Each open role emits JobPosting
schema (Part One, Section 9.2); closed roles emit nothing.
7. Legal and other single-type pages
Privacy Policy, Terms of Service, and Cookie Policy are Strapi single types with a proper
content architecture: an ordered list of formal sections, each paired with a plain-summary
box, plus a last-updated date and a seo component. Each formal section is an H2, which
drives the mobile floating TOC (Part One, Section 13). The cookie policy pairs with the
consent banner, which offers granular toggles per cookie type; personalisation and analytics
load only after consent. Additional single-type policy pages can be added the same way. All
legal copy is reviewed by counsel before publication.
8. Dynamic date tokens
Editors can place date tokens in any content field and the frontend renders the current value,
updating automatically as time passes: [year] renders the current year, for example 2026,
and becomes 2027 automatically when the year changes. [month] renders the current month
name, for example June. [month-year] renders the current month and year, for example June
2026. Tokens are resolved at render time on the frontend against the Africa/Lagos timezone,
so a page that says "the [year] guide" is always current without an edit. The CMS preview
shows the resolved value so the editor sees exactly what will publish.
9. CMS AI features (drafts the editor reviews; nothing
reveals it is AI)
All CMS AI runs through the Oge CRM Worker tier (Part One, Section 10), grounded in the
knowledge base, batched at publish or on demand so it stays inside free tier limits. Every
feature produces an editor-reviewable draft, reads as spoken word, and uses no em dashes,
jargon, cliches, or buzzwords. None of the output indicates that it was AI-generated.
9.1 Article-level author bio
Generated per article from the author profile and the article topic, for EEAT (Section 4.3).
9.2 SEO meta title and description
Generated from the article content, the meta title kept within 60 characters and the meta
description kept between 155 and 160 characters by the live counters, optimised to earn the
click and to read naturally. The editor can edit; the counters enforce the limits.
9.3 TL;DR or quick summary
Generated from the body for the premium summary box (Section 4.4).
9.4 Answer-styled FAQ section
Five to seven question-and-answer pairs generated from the article for answer-first and
generative-engine value (Section 4.5).
9.5 Recommended reads
Three topically aligned articles suggested per article (Section 4.7).
9.6 Internal linking suggestions
The system auto-generates internal linking opportunities the way a senior SEO specialist
would: it scans the article against the full site (services, industries, other articles,
programmatic pages), proposes the best target pages, writes contextually correct anchor
text for each, and explains the rationale briefly. The editor sees a list and implements any
suggestion with a single click, which inserts the link with the proposed anchor text at the right
place. Suggestions only ever point to real, published, well-matched pages, and never
over-link a single paragraph.
9.7 Content optimisation for SEO, GEO, AI Overview, and AI citation
A content optimisation helper reviews a draft and suggests improvements that make it rank
and get cited: an answer-first opening in the first 80 words, clear question-shaped headings,
self-contained answers that an engine can lift, the right schema type for the piece, scannable
structure, and the entity and topic coverage that strengthens authority. It flags passages that
are vague, padded, or buzzword-heavy and proposes plainer wording. The editor accepts or
edits each suggestion. The helper never invents facts or statistics; for any number it points
the editor to a real source or marks it for verification.
9.8 SEO and structured-data assist
The helper confirms the structured data that will be emitted for the article type, surfaces any
missing field (for example an absent author LinkedIn that weakens EEAT), and verifies the
meta and OG fields are complete before publish.
10. Programmatic SEO from the CMS
The pseo-page type and its template route are owned here. Programmatic pages can be
generated from the service-and-industry matrix, the transactional and comparison templates,
and from strong Insights articles on commercial topics. When an article is a good
programmatic seed, the system proposes a pseo-page derived from it, carrying the
source-article relation. Before the publish button activates, every programmatic page must
pass the full non-negotiable quality gate in Part One, Section 9.7: genuinely unique and
helpful content, the more-than-half-unique rule, EEAT in place (named author, real expertise,
cited sources), three or more distinct data sources or public data combined with proprietary
Nexoris Technologies insight, structure that satisfies the searcher's intent in depth (a real
comparison matrix, a real pricing table, or actual functionality and scope), and for
location-based pages a genuinely distinct structure with distinct local data per page rather
than a templated city swap. The CMS enforces this as a checklist that must be fully
complete, and the page cannot publish until every item is checked and the cited sources are
present. The pipeline picks up new article topics automatically and proposes new
programmatic pages from them, so the layer grows from real editorial output rather than a
fixed list, always human-gated, and the gardening rule retires pages that earn nothing after
two quarters.
11. Schema auto-generation per article type
The right schema is auto-generated and implemented per article type, with the builders living
in packages/seo and the CMS supplying the data. A standard article emits Article or
BlogPosting; a how-to piece emits HowTo where genuinely step-based; a comparison or
listicle emits the appropriate type. Every article carries: author as a Person (with sameAs
LinkedIn), the fact-checker as reviewer (a Person), publisher as the Organization,
datePublished and dateModified, articleSection from the category, inLanguage en-NG, the
primary image as ImageObject, and a BreadcrumbList. The auto-generated FAQ section
emits FAQPage. Author pages emit ProfilePage with a Person mainEntity. Builders omit any
field whose real data does not exist, so the structured data is never fabricated.
12. The public URL path field (editor clarity)
Every routable content type (insight, job, pseo-page, and the legal single types) shows the
editor the full public URL exactly as it will appear when published, for example
https://nexoristech.com/insights/how-to-reduce-clinic-no-shows. The full URL path is
read-only so the editor can see precisely where the page will live, while the slug segment
alone is editable. Editing the slug updates the read-only full URL preview live. The
reserved-slug validation runs on save so a new slug can never collide with a hardcoded
route or an existing page. Article URLs always render flat under /insights/ regardless of the
category chosen.
12.1 Index or de-index control
Every routable content type carries a clear index or de-index toggle in its SEO panel. When
an editor sets a page to de-index, the system applies a robots noindex directive to that page,
removes it from the XML sitemap in the same publish so the two never disagree, and keeps
the canonical correct. When set to index, the page carries no noindex and is included in its
sitemap group. The toggle reads in plain language ("Show this page to search engines" with
an on and off state) so an editor does not need to know the term noindex, and the resolved
state is shown in the preview. The check:seo gate verifies that the noindex directive and
sitemap inclusion always match the chosen state.
12.2 Redirect management
The CMS includes a redirect manager so an editor can create a redirect without a developer.
The editor adds the source URL they want to redirect, selects the redirect type (301
permanent or 302 temporary), enters the destination URL, and saves. The redirect takes
effect automatically: apps/web reads the redirect table (cached, revalidated on change
through the publish webhook) and serves the redirect at the edge or in middleware before
rendering, so visiting the source path sends the visitor to the destination with the chosen
status code. The manager validates that the source does not collide with a live routable
page, warns on redirect chains and loops, and lists all active redirects with their type and
destination for review. When an article or job slug changes, the system offers to create a 301
from the old URL to the new one automatically so no published link breaks.
13. Workflow, roles, preview, and delivery
Draft and Publish on every Strapi type, with preview mode wired to Next.js draft routes so
editors see the exact page, including resolved date tokens and the read-only URL, before
publishing. Webhooks on publish, update, and delete trigger two actions: Next.js on-demand
revalidation (the affected slug plus hub pages, the relevant sitemap group, and the RSS
feed) and the Oge re-ingestion endpoint so the knowledge base stays current. The
pseo-page publish button activates only when the quality-gate checklist is complete. Roles:
Editor (Insights, authors, testimonials, jobs), Marketing lead (Insights, legal, pSEO pages,
SEO fields), Admin (navigation, global, schema settings, everything). The AI helpers appear
as panels inside the editing screens, each producing a reviewable draft. Slug protection via
the reserved list runs on save. Localisation is installed but dormant; English at launch,
French the first planned locale. Published content indexes to Meilisearch on every publish
event, powering AI search and Oge retrieval.
14. CMS admin design and image pipeline
The Strapi admin and any custom panels use the dashboard typography from Part One,
Section 14 (Inter for titles, headings, table headers, and data; JetBrains Mono for IDs), with
the standard sizes, weights, line heights, and tracking defined there, and the same 4px
spacing scale. Admin tables and any frontend-rendered tables follow the responsive table
rules (Part One, Section 14.8) so they stay readable down to 280px. The media pipeline
converts every uploaded image to WebP on the VPS at upload, generates responsive
variants once, stores them on the VPS filesystem, and serves them directly with no CDN,
exactly as Part One, Section 16 specifies. Alt text is required on publish for any image
attached to published content.
PART THREE: THE INTERNAL ADMIN
DASHBOARD (CRM MODULE)
1. Role and scope
The Nexoris Technologies internal admin dashboard is the in-house, staff-facing platform for
running the company. It is built in-house as apps/admin on PostgreSQL (nexoris_admin) and
designed as a modular dashboard: a shared shell (authentication, navigation, roles, theming,
and the audit log) into which business modules plug over time.
This build delivers the first module, the CRM, and nothing else. Other modules, for example
project delivery, finance and invoicing at company scale, HR, and internal knowledge, are
planned for later builds and are out of scope here. The architecture must make adding them
later straightforward: the shell, the role system, the navigation, and the data layer are built to
host more modules without rework, but no other module is designed or built in this
engagement.
The CRM module is integrated with the Oge CRM Worker tier (Part One, Section 10) for all
AI work, so one grounded, efficient AI gateway serves both the website and the staff
dashboard. It is where the scored leads from Part One, Section 11 are received and worked.
The fallback chain ensures AI never blocks the sales motion: if all CRM Worker slots are
unavailable, the lead arrives unscored-pending with a rules-based baseline, jobs queue for
retry, and the salesperson can still work and write manually.
1.1 The dashboard shell (built once, shared by every module)
Because the CRM is the first module of a platform rather than a standalone app, this build
also delivers the shell it lives in, sized for one module now and ready for more later: a single
sign-in to the Nexoris Technologies internal admin dashboard, a left-hand module navigation
(showing the CRM now, with room for modules added later), a shared role and permission
system, shared theming using the dashboard design tokens (Part One, Section 14), and a
shared, immutable audit log. The shell is deliberately thin: it does not assume anything
specific to the CRM, so a future module plugs in without reworking it. Everything from
Section 2 onward in this part describes the CRM module that runs inside this shell.
2. The CRM module: the sales system of record
2.1 Lead sources
Every lead carries its source (website form, Oge, Solution Finder, WhatsApp, email, referral,
or a specific programmatic or cost page) and its evidence. The website is the primary
source, and recording the originating page lets the team see which pages and which
programmatic entries actually produce revenue.
2.2 Lifecycle stages
New, Contacted, Qualified, Scoping Call Booked, Proposal Sent, Negotiation, then Won,
Lost, or Nurture. New carries a first-response SLA timer set to the one-business-day
promise, alerting the salesperson before breach and the admin at breach. Lost requires a
reason from a controlled list; Nurture requires a revival date so the lead resurfaces
automatically.
2.3 Assignment
Auto-assignment on intake, round-robin modified by industry affinity, capacity caps, and
working-hours awareness so an overnight lead queues for the morning rather than burning
someone's SLA. Reassignment is admin-only; a salesperson may request reassignment with
a reason, and the admin approves or declines. Every assignment, reassignment, stage
change, and target edit writes an immutable audit row recording who, what, when, and the
before and after.
2.4 Roles
Admin: everything, plus add and deactivate a salesperson, reassign, set targets, export, and
view the audit log. Salesperson: own leads, log activities, move own leads through stages,
use the AI assists, and see own performance and the team leaderboard. No reassign, no
delete, no export. Optional read-only Viewer for leadership.
2.5 People management
Add a salesperson (name, contacts, industries owned, capacity cap, targets) and deactivate
one (access ends instantly, history preserved, open leads flow to the admin reassignment
queue). History is never hard-deleted, because it is the asset.
2.6 Targets and performance
Weekly and monthly targets per person and team, split into activity targets (first responses
within SLA, calls, meetings, proposals) and outcome targets (qualified leads, deals won,
revenue won in NGN). Dashboards per person and team: targets versus actuals, pipeline by
stage, conversion between stages, average first-response time, win rate, and source
performance so the website and programmatic pages prove their revenue. A daily activity log
with quick-log buttons and auto-captured Oge transcripts, built for focus and coaching. An
SLA board visible to all, sorted by urgency. Two scheduled dashboard views complement the
live ones: a weekly dashboard summarising the week just closed (activity and outcomes
against the weekly targets, pipeline movement, deals won and lost, SLA performance, and
the leads each source produced) and a monthly dashboard summarising the month (revenue
won against the monthly target, the full conversion funnel, source performance, lost-reason
patterns, and each salesperson on one page). Both can be viewed in the app and exported,
and both are also delivered as the written digests in Section 4.
3. The three Oge-integrated AI features of the CRM
module (CRM Worker tier)
All run through apps/oge CRM Worker tier, grounded in the same knowledge base and lead
data, drafts-only where they produce text a person sends, batched or on-demand, never per
keystroke. The try-catch fallback chain applies to every call.
3.1 Lead scoring with a clear justification
Every lead is scored 1 to 100 on arrival with a Hot, Warm, or Cold band. Every score carries
a clear, plain-language justification that names the specific signals behind it: the fit against
the ideal customer profiles, the intent signals detected in the message, the completeness of
what was shared, and the source and page. The justification is shown beside the score so a
salesperson understands why a lead is hot or cold and never has to guess. The score orders
the queue; it never auto-rejects anyone, because a low score is still a person who reached
out. The primary model scores; the backups score on failure; the rules-based component
produces an immediate baseline so the lead is never unscored at intake. Runs once per lead
and is cached.
3.2 Auto-response generation
For any lead, the CRM Worker drafts a reply grounded in the lead's own words and the
matching service and industry pages. Drafts read like a knowledgeable person talking across
a table. No email draft contains an em dash, a buzzword, jargon, or a cliche, and no draft
quotes a price or a date the salesperson has not set. The salesperson reviews and sends;
nothing auto-sends. A regenerate option produces a different version. On demand, not on a
schedule.
3.3 Service recommendations
Each lead is tagged with the Nexoris Technologies services and industry it matches, using
the same deterministic mapping the Solution Finder uses, with a short rationale and the
relevant page links, so the salesperson walks into the call informed and pipeline reporting by
service is accurate from day one.
4. Supporting and added smart features
All are easy to implement, batched or on-demand, grounded, and never per keystroke. They
reuse the same gateway and caches, so they add intelligence without adding cost. Instant
plain-language lead summary on arrival, five lines: who, what they want, which services
match, urgency signals, and the suggested first move. Technical-fit note for leads describing
a system or integration, for example "this reads like a Shopify migration plus an inventory
integration", so the salesperson is prepared. Suggested talking points drawn from the site's
own pages, so sales and site stay consistent. Smart deduplication and company matching
on intake, flagging likely duplicates for the admin to merge by normalising names and
spotting variants. A simple urgency and sentiment tag so hot leads surface fast and the right
person handles a frustrated one. Next-best-action suggestion per lead, one plain sentence
with its reason, for example a second touch by WhatsApp when an email has gone
unanswered for three days. Duplicate-safe follow-up reminders and a revival nudge that
resurfaces a Nurture lead on its revival date. A weekly written pipeline digest per
salesperson and admin (scheduled batch, off-peak), in five plain sentences rather than
fifteen charts. A monthly lost-reason and source-pattern analysis whose findings feed the
website's FAQ and Insights content plans, closing the loop with Oge's gap report (scheduled
batch, off-peak). A won-deal handover checklist that creates the delivery-side record so a
client is never dropped between sales and delivery. Each added feature either serves the
one-business-day promise or measures it, and none of them produce text that breaks the
voice rules.
5. Voice rules for all CRM module text
Every piece of text the CRM module generates for a human to send or read (auto-response
drafts, summaries, justifications, talking points, digests) reads like spoken word from
someone who knows the topic. No em dashes. No buzzwords, jargon, or cliches. "Nexoris
Technologies" is always written in full. No invented price, date, client name, or result. These
rules are enforced in the prompts and checked in QA (Part Four).
6. Efficiency and degradation in the CRM module
The CRM module reuses the efficiency strategy in Part One, Section 10.4: scoring,
service-tagging, technical-fit, talking points, and tagging run once per lead on arrival and are
cached; digests and pattern analysis are scheduled batch jobs; auto-response drafts are on
demand. Nothing polls and nothing runs per keystroke. The CRM Worker fallback chain
ensures scoring never blocks intake and the sales motion continues uninterrupted even
when all generative slots are temporarily unavailable.
7. Document and PDF template engine
The CRM module includes a premium document engine for preparing the documents a sales
motion needs: proposals, scopes of work, service level agreements, project contracts or
agreements, and invoices. Every template is styled in the Nexoris Technologies brand, in the
primary purple #543CDA with the brand neutrals, and carries the Nexoris Technologies logo,
the company address and contact details, and consistent typography that matches the
dashboard system (Inter for text, JetBrains Mono for figures, identifiers, and money
amounts).
How it works: the salesperson selects a template (proposal, scope of work, SLA, contract, or
invoice), then uploads or pastes the text and the values for that document. The system
inserts the content into a well formatted, branded template, building tables wherever the
document needs them (for example a scope-and-deliverables table, an SLA
response-and-resolution table, a milestone-and-payment schedule, or an invoice line-items
table with quantities, rates, and totals), and produces the finished document as a
downloadable PDF. The salesperson reviews before sending, and the document attaches to
the lead or deal record so the full history travels with it.
Template behaviour: The brand header and footer (logo, company details, page numbers,
and the document title) are applied automatically and consistently across all template types.
Invoices auto-calculate line totals, subtotal, any tax or discount entered, and the grand total
in NGN, with money amounts right-aligned in JetBrains Mono, and carry an invoice number,
issue date, and due date. Proposals and scopes of work lay out sections, deliverables,
timelines, and assumptions, with tables where the content is naturally tabular and prose
where it is not. SLAs and contracts lay out clauses and the service or commercial terms
cleanly, with tables for tiered service levels or schedules. Dynamic fields (client name, dates,
amounts, the salesperson's name) are filled from the lead or deal record where available and
editable before generating. The PDF is generated server-side, is selectable and searchable
(not a flat image), is responsive in layout so tables never overflow the page, and renders any
embedded image in WebP within the document while the file itself is a standard PDF. All
generated text obeys the CRM voice rules in Section 5: plain spoken English, no em dashes,
no buzzwords, jargon, or cliches, "Nexoris Technologies" always in full, and no invented
price, date, or result. Where AI helps draft a proposal or scope from the lead context, the
output is a draft the salesperson reviews and edits before generating the PDF.
PART FOUR: QUALITY, DELIVERY, AND
RISK
1. Quality assurance
1.1 Automated gates (block merge)
check:seo on every route (Part One, Section 9.11). check:a11y (axe-core) failing on any
serious or critical issue. Unit tests for every schema builder and metadata function, including
the omission rules. A Lighthouse CI budget check on the four sampled pages, mobile and
throttled, targeting 95 or above and green Core Web Vitals. A content-fidelity test that
byte-diffs rendered H1s, sublines, and CTAs against the approved copy files. House-rule
checks: no em dash in the diff, no buzzwords, jargon, or cliches in copy or AI output (a lint
list plus manual review), and no standalone "Nexoris" in any user-facing string.
1.2 AI quality
The acceptance tests in Part One, Section 10.7 run automated where possible and manual
where not, including the grounding test across all three website bot slots, the degradation
test (no visible failure at any point in either fallback chain, no stack trace to the UI), and the
cache test (paraphrases do not double the call count). CMS AI tests: author bio, TL;DR,
FAQ, and meta all read as spoken word with no AI tell and no banned wording, and meta
stays within limits. CRM AI tests: every score returns a band and a clear justification from all
three slots; auto-response and every other draft contain no em dash, buzzword, jargon,
cliche, invented price, or invented date; service tagging resolves to real pages.
1.3 Responsiveness and rendering
Every screen is verified at 280, 320, 360, 414, 768, 1024, and 1440px with no horizontal
overflow. Tables render correctly in their chosen small-screen pattern. All images render as
WebP from the VPS. The OG card renders as PNG and passes the WhatsApp and LinkedIn
share debuggers.
1.4 Manual pre-launch
Cross-device testing on real Android and iOS hardware on a throttled connection, NVDA and
VoiceOver full-page passes, the share-debugger checks, a full Solution Finder and
lead-to-CRM round trip from each of the three capture paths, verification that all three
website bot and all three CRM Worker fallback slots activate correctly in isolation, verification
that quota exhaustion degrades cleanly with no error visible to the visitor, and the legal-page
NDPR review sign-off before any legal copy goes live.
1.5 Definition of done
A stage is done only when every automated gate is green, the manual checklist for that
stage is complete, there is no TODO comment in shipped code, and accessibility is not
deferred. A failing check never ships.
2. Delivery plan
Stage 0: monorepo scaffold (apps/web, apps/cms, apps/oge, apps/admin), packages (ui,
seo, config, kb), brand Tailwind preset, docker-compose for PostgreSQL with pgvector and
Meilisearch, env.example with slots for all provider keys and the three database URLs, the
project commands wired with check:seo and check:a11y as failing stubs. Stage 1:
packages/seo complete (schema builders with NG locale, OG cards, split sitemaps,
robots.txt, llms.txt, and the Google sitelinks eligibility measures in Part One, Section 9.9) and
check:seo as a real gate, before any page. Stage 2: packages/ui design system to Part One,
Sections 14 and 15, with the three font contexts, the keyboard-correct header flyouts, the
mobile drawer, the mobile TOC, and the responsive table patterns; check:a11y gate live.
Stage 3: hardcoded content modules generated from the four approved copy files, with the
content-fidelity diff test. Stage 4: the 33 hardcoded marketing pages, the content API
supplying case study cards and testimonials, all schema and OG live, Core Web Vitals
green. Stage 5: Contact lead capture (form, smart form assistant, instant acknowledgement)
posting to the admin dashboard CRM intake with CRM Worker scoring, and the Solution
Finder at its three entry points. Stage 6: apps/oge knowledge base and ingestion
(packages/kb), hybrid retrieval, the three-slot website bot fallback chain, the grounded chat
endpoint and system prompt, lead capture, the Solution Finder rationale, and the extractive
fallback with handoff panel. Stage 7: the Strapi CMS (insight, author, category, job,
pseo-page, legal single types, proof types, the content API, the read-only URL field, the
index or de-index toggle, the redirect manager, and the dynamic date tokens), the seed for
legal pages and starter content, preview routes, and revalidation webhooks. Stage 8: the
Insights hub with the article card grid, latest-first sorting, excerpt and published date, and the
Load more pattern; the homepage Insights section showing the latest three; the article page
with the full EEAT structure (author and fact-checker snippet, AI author bio, TL;DR box,
answer-styled FAQ, short-title TOC, recommended reads, internal-link suggestions); author
pages; the careers hub and job pages with cover images; legal pages; AI search; the mobile
TOC; and the article and FAQ schema, with every CMS AI helper wired and
editor-reviewable. Stage 9: apps/admin, the Nexoris Technologies internal admin dashboard.
First the shared shell (single sign-in, module navigation ready for future modules, the shared
role and permission system, dashboard theming, and the shared immutable audit log), then
its first and only module for this build, the CRM (sources, stages, assignment with
admin-only reassignment, roles, people management, targets, dashboards including the
weekly and monthly dashboard views, SLA board) integrated with the Oge CRM Worker tier
for lead scoring with justification, auto-response generation, and service recommendations,
plus the supporting and added smart features and the document and PDF template engine
(proposals, scopes of work, SLAs, contracts, and invoices in the Nexoris Technologies brand
with the logo), with the CRM Worker fallback chain live. No other dashboard module is built
in this stage. Stage 10: hardening (Core Web Vitals and Lighthouse gates, security headers,
the cookie consent banner with granular toggles wired to the legal copy, 404 and error pages
in the house voice, share-debugger tests) and the launch runbook (env for all provider keys
and database URLs, deploy sequence for the four apps on the VPS, webhook URLs, DNS,
Search Console submission, sitemaps, full knowledge-base ingest in production, and
fallback smoke tests on every provider slot). Stage 11: programmatic SEO (the template
route with its quality-gate publish guard and the data-readiness gate so the layer is
unpublished by default; the proof substitution ladder so no page renders empty and none
fabricates; a deliberately small first wave of roughly 10 to 20 fully data-complete permutation
and cost pages starting from the in-house products and the strongest researched local data,
growing one ready page at a time; the readiness dashboard; the article-derived
programmatic pipeline; the quarterly AI-visibility tracking; and the first annual original-data
report).
3. Product-launch priority
The revenue path first: Home, Contact, About, How We Work, with the full lead-capture loop
end-to-end tested before anything else ships. Then the top six services, then the top eight
industries, then the remaining services and industries, then the Case Studies hub with the
Covyvo and GLEEN stories as the opening entries, then the Insights hub with the first six
articles, then programmatic wave one, then the AI layer polish, then programmatic wave two
guided by Search Console data and the first annual report, then careers populated with the
first roles, then comparison and location pages, then the French locale when prioritised.
4. Risks and mitigations
Model rate-limit exhaustion (website bot): the three-slot fallback chain, with two independent
free-tier providers behind the primary, so a visitor never sees a broken feature; the worst
case is the extractive handoff panel. Model rate-limit exhaustion (CRM worker): the
three-slot chain with a separate Google Cloud project for independent quota, and
rules-based scoring firing immediately so no lead is ever unscored at intake. AI hallucination:
strict knowledge-base grounding at the system-prompt level, the empty-retrieval honesty
rule, the no-invented-numbers rule, and acceptance tests against each model slot in
isolation. Thin programmatic pages harming SEO: the non-negotiable quality gate in Part
One, Section 9.7 (unique and helpful content, EEAT, three or more distinct data sources,
intent-deep structure, and distinct local data and structure on location pages), the
more-than-half-unique rule, the publish guard that blocks any page failing the gate, and
quarterly gardening. Weak proof at launch: handled structurally rather than left as a race.
The proof substitution ladder (Section 9.6) means every page carries genuine, honest
credibility from day one (real adjacent proof, the in-house Covyvo and GLEEN builds, or
capability and process proof) without ever rendering empty and without fabricating a client
result, and the data-readiness gate (Section 9.7) holds any page back until its proof and data
are genuinely complete, so the site never ships near-empty pages. Securing named client
case studies with verified numbers remains the highest-value upgrade because real client
proof converts best and automatically replaces the lower ladder tiers as it arrives, but it is no
longer a launch dependency or a deadline: the system is safe and credible before the first
case study exists. Fabricated structured data or proof: builders omit absent fields and proof
sections render nothing without real data. CMS outage: the 33 hardcoded marketing pages
are fully static and unaffected; only Insights, authors, careers, legal, and programmatic
depend on Strapi, and they are cached at ISR intervals. Model string drift: all identifiers
pinned in one config file with an instruction to verify against each provider's current
documentation before pinning. Provider key exposure: all provider keys live only in
apps/oge, never in apps/web, and the browser never calls a provider directly. AI tell or
banned wording slipping into published or sent text: the spoken-word voice rules are
enforced in every prompt and checked in QA, and every AI output is editor- or
salesperson-reviewed before it publishes or sends. Legal non-compliance (NDPR): the legal
pages are reviewed by counsel before publication, and the cookie consent banner offers
granular toggles.
5. Out of scope and reuse
Out of scope: e-commerce or payments on the marketing site; real-time per-keystroke AI
beyond the debounced smart form assistant; multi-language site chrome (Oge is English
only; French content is a planned future locale, deferred); native mobile apps; sending email
from the website (the admin dashboard CRM module sends, the website drafts only); every
internal admin dashboard module other than the CRM (project delivery, company-scale
finance, HR, internal knowledge, and any other module are planned for later builds and are
not designed or built here, though the shell is built to host them); and the Covyvo and
GLEEN product builds (separate projects with their own sites, appearing here only as case
study cards with outbound links). Reused by future Nexoris Technologies properties:
packages/ui (the full token set and components), packages/seo (schema builders, OG
generator, sitemap utilities), packages/kb (the knowledge-base builder and ingestion
pipeline), the Oge client and gateway (both tiers), the lead-intake contract (scoring with
justification, source tagging, submission to the admin dashboard CRM module), the admin
dashboard shell (auth, module navigation, roles, theming, and audit log, ready to host future
modules), and the content-module pattern. A new property that imports these inherits the
brand, the SEO engine, accessibility, grounding, and Oge with no new plumbing.
End of the Nexoris Technologies Digital Platform Product Requirements Document.
