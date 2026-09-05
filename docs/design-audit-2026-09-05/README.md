# Nexoris Technologies: complete website design audit

Date: 5 September 2026

Scope: the public website in `apps/web`, including its Oge introduction page.

Deliverable: original audit and art direction, followed by the implementation documented in [IMPLEMENTATION.md](IMPLEMENTATION.md). The observations below describe the pre-change site.

Git constraint: work belongs on `dev`. Do not merge or push this work to `main`.

**Final user direction:** retain the supplied homepage image and its original composition. Use hyper-realistic contextual AI imagery elsewhere, with Black African people and visible illustrative provenance. CMS owns case-study content and relationships; never manufacture evidence in frontend code.

## Design judgment

Nexoris already communicates its services clearly. The service demonstrations, Nigerian business context, direct contact paths, and existing product screenshots provide a sound foundation. The premium opportunity is to make the company feel more specific, composed, and credible.

The dominant pattern today is a dark purple glow, a centered heading, explanatory text, rounded icon cards, another dark band, and a large closing CTA. Repeated across dozens of pages, that pattern makes the site feel assembled from a template. Adding more gradients, animation, decorative icons, or indiscriminate stock photography would reinforce that impression.

**Recommended direction: an established Nigerian technology studio with editorial restraint and visible evidence of its work.** Retain the recognizable purple and ink palette. Give typography and composition more authority. Show relevant people, real environments, and clear software artifacts. Use fewer decorative containers and give important content a visibly different level of emphasis.

The five most valuable changes are:

1. Replace placeholder-looking proof with an honest, finished presentation of available work. The case-study hub currently displays placeholder headings under “Verified case study.” The homepage proof component uses hardcoded example figures. Visual polish cannot compensate for uncertainty about evidence.
2. Give each industry page a relevant visual identity. All 20 currently contain no editorial photographs, although their written content is sector-specific.
3. Simplify the visual system: less purple haze, fewer shadows and badges, clearer reading widths, and more varied section compositions.
4. Art-direct the article library. Keep relevant photographs; replace neon technology metaphors and dense text baked into images with sober photography, clean diagrams, and accessible charts.
5. Improve mobile hierarchy and the relationship between content and floating controls. Important controls fit in the inspected mobile layouts, but long introductions and overlapping visual furniture make the pages feel heavier than necessary.

Testimonials were deliberately omitted. **Do not add testimonials, quotation carousels, invented client logos, ratings, or substitute testimonial sections.** Credibility should come from real work, clear deliverables, named people, and documented process.

## Coverage and method

The inventory reconciles the source route tree, all hardcoded content modules, the running sitemap, visible navigation, and a read-only query of published CMS content. This avoids relying on the sitemap alone: `/oge/` is a real route that the current sitemap does not list.

| Page group | Available pages | Review performed |
| --- | ---: | --- |
| Core marketing | 5 | Every route opened; page structure, imagery, source, and visual presentation reviewed |
| Services | 11 | Every route opened; each distinct hero demonstration and complete section outline reviewed |
| Industries | 20 | Every route opened; complete section outlines and shared template reviewed; individual imagery recommendations below |
| Insights index | 1 | Desktop/mobile, search, categories, and no-results state |
| Published articles | 8 | Every article opened; heading structure, cover imagery, and image inventory reviewed; representative long-form body inspection |
| Careers index | 1 | Desktop/mobile and actual no-vacancies state |
| Legal | 3 | Every policy opened; headings, reading layout, and contents navigation reviewed; mobile privacy example |
| Author profile | 1 | Published profile opened; portrait, biography, article collection, and contents text reviewed |
| Oge introduction | 1 | Desktop/mobile, avatar presentation, capabilities, and conversation examples |
| **Published content pages** | **51** | **All individually represented in this report** |
| Not-found boundary | 1 state | Opened using `/404/`; branded recovery content verified |
| Case-study detail, job detail, generated SEO pages | 0 published | Templates reviewed in source; not claimed as live visual inspections |
| Legacy author URL | Redirect | Source confirms permanent redirect to the root author profile |
| Error, consent, form submission states | Conditional states | Source review where activating the state would require an intentional failure or submission |

Desktop review used 1440 × 900 after initial inspection at the ambient browser size. Mobile examples used 390 × 844 and covered home, about, contact, product development, automation, healthcare, Insights, a full article entry, privacy, careers, case studies, Oge, and the navigation drawer. This is a design audit, not a claim of exhaustive browser, accessibility, performance, or transaction testing. No contact brief, newsletter subscription, job application, or lead was submitted.

The published-content query found eight articles and three policies, with no published case studies, jobs, or generated pages, including no hidden `noindex` generated pages. The sitemap also exposed one author. Future CMS records should inherit the relevant template recommendations below.

Evidence files: [route inventory](routes.json), [published content](published-inventory.json), [browser observations](observations.json), [mobile observations](mobile-observations.json), and [settled checks](settled-checks.json). Screenshots are in `evidence/`. Initial DOM measurements sometimes precede route CSS or lazy images: a `loaded: false` observation alone is **not** a broken-image finding. The initial mobile Insights overflow observation cleared once the route settled; it is not reported here as a confirmed overflow defect. Full-page stitched captures were not used to infer duplicated content. Development tooling in screenshots is not part of the production design.

## Shared visual system

### Typography and reading hierarchy

- Retain the existing self-hosted Inter/Roboto foundation for the first iteration. Font replacement is less valuable than fixing hierarchy, measure, and spacing. Use Inter for navigation, body, labels, and controls; use the heading face consistently. Restrict JetBrains Mono to genuinely technical labels and occasional small section numbers.
- Long, centered paragraphs are especially tiring in split service heroes. Left-align the copy column on service pages, about, and contact; retain a centered composition only where it suits a short statement.
- Suggested starting scale: home display 56–64 px desktop; service/industry H1 48–56 px; article H1 40–48 px; H2 32–40 px; H3 20–24 px; body 17–18 px. On mobile use 32–38 px H1, 26–30 px H2, and 16–18 px body. These are responsive ranges, not fixed sizes that force copy to fit.
- Keep marketing prose around 52–65 characters per line and article prose around 65–75. Use approximately 1.6 line height for marketing body and 1.65–1.75 for long reading. Preserve the existing editorial serif option for articles if it is applied deliberately and consistently; avoid imported bold/serif formatting that varies between policies.
- Use 13–14 px for useful metadata where possible. Tiny uppercase monospace labels should not carry information readers need to make a decision.
- Preserve full titles and content in the document. Improve wrapping and hierarchy rather than hiding long article titles behind ellipses or truncating essential explanation.

### Layout, rhythm, and density

- Establish a shared 1200–1280 px content frame for ordinary desktop sections, with wider product/media moments used intentionally. The current 1440 px maximum plus relatively small gutters allows some grids to feel spread out.
- Start with 80–104 px major-section padding on desktop and 48–64 px on mobile. Use 32–48 px between a section introduction and its content, 24–32 px card padding, and a consistent 8 px spacing rhythm. Do not apply the same generous padding to every minor subsection.
- Vary composition by purpose: editorial rows for principles, a connected sequence for process, a large figure for proof, compact lists for related services, and restrained accordions for FAQs.
- Reduce the number of nested rounded rectangles. A section, its card, its icon tile, and its button do not all need separate tinted backgrounds and shadows.
- Preserve real controls even when simplifying their visual surroundings. A working calculator or finder is more valuable than a large static hero photograph in the same space.
- Avoid adding length merely to look substantial. Most pages already have a problem, capabilities, AI explanation, process, FAQ, and CTA. Add a visual to an existing section before adding another generic section.

### Colour, surfaces, icons, and motion

- Keep `#543CDA` as the main brand/action purple and `#0D0A1C` as the deep ink. Use warm or neutral off-white for the majority of reading surfaces. Test a neutral such as `#F7F7F5` alongside the existing brand rather than covering everything in lavender.
- Reserve purple for primary actions, selected controls, relevant highlights, and small brand details. Reduce large radial glows and saturated purple shadows, especially behind portraits and technical demonstrations.
- Use one subtle border colour and one low-elevation shadow. Suggested radii: 6–8 px controls, 10–12 px panels, 12–16 px editorial imagery. Large rounded portrait tiles should feel like photography, not app icons.
- Give real interactions clear hover, pressed, disabled, and focus states. Static explanatory cards should not lift and glow as though they are clickable.
- Preserve meaningful widget transitions and existing reduced-motion behaviour. Shorten decorative movement to roughly 150–250 ms where appropriate; avoid entrance effects on every paragraph, quote, and card. Use direct state changes for preference-sensitive motion.
- Keep icons from one consistent family, with consistent stroke and optical size. An icon should identify a thing, not fill a vacant corner.

### Header, navigation, footer, and floating controls

The current header is usable and the mobile drawer has a clear structure. Refine rather than rebuild it.

- Improve the wordmark's optical weight and contrast: the secondary “Technologies” text is visually subdued. At small phone widths the header shows only the mark. Consider a compact “Nexoris” wordmark beside it so an unfamiliar visitor can identify the company immediately.
- Keep all 11 services and 20 industries reachable. In the desktop menu, increase legibility and give group labels a clearer relationship to the links. A large glowing promo panel is unnecessary beside an already comprehensive service list.
- Align industry names and group labels between the homepage and navigation. They currently use different grouping systems and sometimes different sector labels. This is a display taxonomy recommendation; URLs and destinations remain unchanged.
- Reduce the footer's monospace density and improve secondary text contrast. Keep the address, phone, email, social destinations, and legal links intact. Use clearer column headings and a quieter legal row.
- Retain WhatsApp, Oge, contents, and back-to-top behaviour. Give the controls a coordinated spatial system: consistent size, a stable edge gutter, adequate separation, and clearance from the last line of content and form actions. Remove excessive glows. The green WhatsApp control should be recognizable without dominating every section.
- On mobile, inspect the open chat, contents panel, cookie dialog, keyboard, and footer together. Keep the existing open/close mechanisms, focus behaviour, and consent choices. Do not remove a useful control simply to make a screenshot cleaner.
- Define minimum target size and contrast as acceptance criteria, not as claims that the present site has failed an automated audit. Aim for 44 × 44 px primary touch targets; WCAG 2.2 AA specifies a 24 × 24 CSS-pixel minimum with exceptions. Normal text generally needs 4.5:1 contrast, large text 3:1. Retain visible focus and reflow at 320 CSS pixels. [WCAG 2.2](https://www.w3.org/TR/WCAG22/)

## Photography and illustration direction

**Casting requirement: no images of white people.** Commission or license imagery featuring Black African people, preferably Nigerian people in the actual business context being described. Apply the requirement to backgrounds, reflections, secondary subjects, thumbnails, screen content, article figures, and future CMS uploads—not just the obvious hero subject. Verify casting through the photographer, supplier, or production brief rather than treating a filename or alt text as proof.

Prefer real photographs of the actual Nexoris team for company, careers, and founder identity. Do not label actors or generated people as employees, customers, named authors, or project stakeholders. If licensed representative photography is used, its caption and alt text should describe the scene without inventing that relationship. Existing about photographs are labelled as the team; confirm that provenance before retaining those labels.

Use natural or controlled daylight, credible workplaces, calm expressions, real equipment, and purposeful activity. Avoid token handshakes, people pointing at nothing, headset smiles unrelated to the task, science-fiction holograms, robot heads, floating brains, luminous circuit clouds, and generic skyscraper photos. Do not make every image a boardroom meeting.

Each image should answer at least one question: who does this serve, what work happens here, what is being built, or what changes in the workflow? If it answers none, leave the space typographic.

| Asset type | Art direction | Production requirement |
| --- | --- | --- |
| Industry hero photograph | A real sector activity with clear context; 4:3 or 3:2, with room for an intentional crop | Keep text beside the photograph; provide a mobile crop that preserves the subject and action |
| Process/document artifact | Actual redacted scope, prototype, test record, handover index, or clearly labelled illustrative example | Text and diagrams rendered sharply; never fabricated client evidence |
| Software product visual | Actual approved screenshot with sample or redacted data | Crop to one meaningful task, retain readable labels, use minimal browser/device framing |
| Article cover | One coherent subject, controlled colour, 16:9 family across cards | No tiny text, charts, or logos baked into the cover as the only source of meaning |
| Charts and workflow diagrams | Clean SVG or HTML, semantic labels, neutral lines with one purple accent | Real source data where quantitative; otherwise explicitly describe the visual as illustrative |
| People/author portrait | Actual person, professional natural expression, neutral background | Consistent framing, realistic skin texture, no excessive retouching or coloured halo |

Use responsive AVIF/WebP where suitable, explicit dimensions or aspect ratios, and focal-point-aware crops. Suggested initial budgets are approximately 150–250 KB for a substantial hero and 60–120 KB for a card, then validate visual quality on actual devices. These are design budgets, not measured present performance. Preserve lazy loading below the fold and prioritize only the essential hero asset. Avoid autoplay video as a default upgrade.

## Core pages: individual recommendations

### 01. Home — `/`

**Observed:** a centered text-led hero followed by a detailed dashboard mockup; repeated card sections for problems, services, process, industries, why-us, and Insights. The main product visual begins below the first mobile screen. The page contains a proof section, no visible testimonial section, and a heavily subdued code-image closing CTA.

**Improve:** make the opening more decisive: a left-aligned promise and restrained product visual on desktop, or a shorter text introduction followed quickly by the visual. Keep both existing CTAs and the complete message. Crop the dashboard to a meaningful workflow instead of scaling an entire dense admin shell down. Label sample/demo content appropriately. Turn the four service groups into editorial rows with stronger numbers and small relevant artifacts. Present the six delivery stages as a connected sequence. Retain all industry links but reduce equal-weight card treatment.

**Images:** keep a software product visual as the main proof. Add one authentic Nexoris working-session photograph beside “What working with us is like,” showing a requirements/prototype discussion. Add four modest industry-group photographs only if each accurately covers its labelled group; individual industry pages provide the fuller sector treatment. Reuse the article-cover standards below for the three latest cards. The closing code photograph is not doing much at its current opacity: use a quiet ink panel or one relevant, clearer crop rather than layering decoration.

**Section recommendation:** bring a compact “Selected work” composition using the existing Covyvo/GLEEN assets closer to the service story. This is an evidence presentation, not a testimonial. Avoid adding another generic benefits section.

**Priority:** P0 for proof credibility, P1 for hero/composition. `ProofStats.tsx` defines the figures −71%, <1 day, and 3.2× as example constants, while the surrounding page says “Verified project figures only.” Confirm provenance before presenting them as client outcomes. Do not invent replacement numbers; keep that content correction separate from calculator or gateway logic.

### 02. About — `/about/`

**Observed:** relevant meeting/collaboration imagery, company origin, mission/vision, values, tools, founder, and a “team is growing” card. On mobile the meeting photograph precedes the title and takes substantial first-screen space.

**Improve:** introduce the company before the photograph on mobile. Make the origin story a composed editorial feature rather than another band of centered copy. Present values as concise principles with one supporting line and fine rules, rather than five equally decorative cards. Reduce the tools section's visual weight. Give the founder an intentional portrait-and-biography layout with a restrained background.

**Images:** retain the existing meeting and collaboration subjects only after confirming their authenticity and usage rights; reduce their purple wash. Commission an actual team/session photograph and a consistent founder portrait if replacements are needed. Do not populate the team with invented people. The growing-team card can remain a small recruitment note without a striped placeholder treatment.

**Section recommendation:** a short “How we take responsibility” block can turn the existing founder involvement and ownership promises into visible working practices. Do not add another values grid or testimonial block.

**Priority:** P1; preserve careers, contact, and process destinations.

### 03. How we work — `/how-we-work/`

**Observed:** six stages, commitments, engagement models, client fit, FAQ, and closing CTA; no editorial images.

**Improve:** make the six stages a visually connected delivery timeline. At each stage show three clearly distinguished labels: activity, client involvement, and deliverable. Use the existing stage content first. Present the three engagement models in a precise comparison layout rather than generic feature cards. Give the commitments section a quiet editorial treatment.

**Images:** add an authentic discovery workshop photograph beside the opening process explanation. Add two or three small redacted artifact views within the relevant stages: scope outline, prototype, and handover documentation. Real artifact details will communicate maturity more effectively than stock developers staring at code.

**Section recommendation:** “What you receive at handover” as a compact checklist using existing ownership/documentation commitments. Avoid adding unapproved delivery promises or new milestones.

**Priority:** P1; all six stages and booking links remain intact.

### 04. Case studies — `/case-studies/`

**Observed:** no published client case studies; three striped placeholder cards are labelled “Verified case study.” Their headings include “The headline result, stated plainly, appears here.” Real Covyvo and GLEEN product visuals appear farther down.

**Improve:** make the existing empty state look deliberately finished. Use one concise, honest empty-state block, and let the real in-house work lead the visual experience. Preserve the populated-grid/filter path for future published work. Give each in-house product a substantial visual, clear product name, short purpose statement, and accurate existing destination.

**Images:** keep the Covyvo dashboard and GLEEN mobile app; use crisp task-focused crops and consistent neutral framing. Avoid generic client-meeting photographs here. The work itself should be the image.

**Section recommendation:** restyle “How we tell each story” as a compact methodology sidebar rather than another large card band. Do not manufacture results to fill space.

**Priority:** P0 for placeholders; P1 for work presentation. Empty-state wording/layout can change without changing CMS queries or filter behaviour.

### 05. Contact — `/contact/`

**Observed:** a large text hero, brief form, prominent purple promise panel, contact details, visit information, next steps, and FAQ. The form includes shaping notes into a brief and multiple send controls.

**Improve:** reduce hero height and bring the form into the first useful screen. Use a clear form hierarchy: contact details, project context, brief, and send action. Keep every field and validation rule. Make “Send my brief” visually primary; make the optional shaping action secondary and the alternate send action quieter, while retaining all handlers. Improve input borders, helper-text contrast, consistent label spacing, and visible focus. Reduce the heavy promise panel.

**Images:** no large hero photograph is needed. Add one small genuine office or entrance photograph within “Visit us” if available and accurate. A founder/contact portrait is useful only if that person really handles the conversation; otherwise omit it.

**Section recommendation:** the existing “What happens after you send this” already answers the right question. Improve its visual sequence; do not add more stages or a new form step. Style the current confirmation/error states as carefully as the initial form.

**Priority:** P1; protect shaping, editing, submission, optional fields, and existing privacy behaviour.

## Service pages: individual recommendations

Apply the shared service treatment to all eleven: left-aligned desktop copy, a consistent demonstration frame, readable widget labels, restrained surfaces, varied body compositions, and shorter repeated process/related-service treatments. Preserve each widget's real controls and state transitions. Where a photographic addition is recommended, place it in the body rather than displacing a useful hero demonstration.

### 06. Product development — `/ai-product-development/`

**Observed:** Website/Web App/Mobile App tabs, product screenshots, six scope items, AI features, delivery stages, and a designer photograph at the close.

**Improve:** normalize screenshot scale between tabs, strengthen the selected-tab treatment, and use a restrained browser frame. Avoid forcing the heading into a tall stack in the left column. Make “What we design and build” an editorial portfolio of outputs rather than six similar icon cards.

**Images:** retain the actual interface previews; show a clear website, application workflow, and mobile screen. Inspect the current CTA designer photograph against the casting requirement; if replacement is needed, commission a Black African product designer reviewing a genuine wireframe wall. Place that image with UX/product design, where it explains the work.

**Section:** add an annotated “From approved prototype to delivered product” artifact pair using existing work or a labelled example. Keep the tab logic unchanged. **Priority: P1.**

### 07. Chatbots — `/ai-chatbots-virtual-assistants/`

**Observed:** Website/WhatsApp/Voice line demonstration, channel/language labels, accuracy explanation, staged delivery, FAQ; no editorial photography.

**Improve:** give user messages, answers, source links, and handoff a clearer hierarchy. Reduce dark-on-dark nesting and tiny channel notes. Distinguish this illustrative service demonstration from the actual Oge website assistant; do not imply that the live Oge product supports every illustrated channel or language.

**Images:** add a small documentary photograph of a Black African customer-service specialist reviewing a customer conversation, placed beside human handoff/accuracy. Prefer a readable conversation diagram to a glowing phone or robot.

**Section:** a compact knowledge source → answer → human escalation visual within the accuracy section. Preserve all demonstration tabs and interactions. **Priority: P1.**

### 08. Automation — `/business-process-automation/`

**Observed:** a useful cost calculator with sliders, a prominent estimate, and dense feature/process sections.

**Improve:** retain the calculator as the main hero asset. Increase the visual distinction between inputs, assumptions, and output. Use tabular numerals, consistent units, legible helper text, and quiet slider tracks. Make the result feel like an estimate, not a verified saving.

**Images:** add a before/after workflow diagram alongside document intake or approvals: intake → validation → human approval → accounting record. Use a genuine Black African operations-team photograph only if it clarifies that workflow.

**Section:** an annotated example automation flow within existing scope. Do not change formulas, slider values, or underlying estimates. **Priority: P1.**

### 09. E-commerce — `/ai-ecommerce-development/`

**Observed:** shopper/card/phone hero photograph, capability cards, AI features, process, industries, and FAQ.

**Improve:** reduce the image overlay and badge treatment. Bring actual commerce interface evidence into “What we build.” A generic shopper demonstrates the audience but not the quality of Nexoris's storefront work.

**Images:** retain or replace the shopper image with a context-accurate Black African customer using a real store interface. Add a high-quality approved storefront/checkout crop and, lower down, a relevant fulfilment or catalogue-management image. Use actual sample data and normal local products rather than imaginary brand logos.

**Section:** catalogue → checkout → fulfilment as a compact operational sequence. Preserve payments, links, and all existing behaviour. **Priority: P1.**

### 10. Dashboards — `/data-dashboards-predictive-analytics/`

**Observed:** a hero dashboard with revenue, orders, runway, a chart, and plain-language query demonstration.

**Improve:** make the chart the focal point, improve labels/legend contrast, simplify the panel chrome, and give actual versus forecast a clear treatment. Avoid making every number purple or equally bold.

**Images:** use a crisp, annotated dashboard screenshot beside the decisions/process section. If people are included, show a Black African operations or finance lead using the dashboard in a relevant setting. No photograph is necessary in the hero.

**Section:** “The decision behind the dashboard,” mapping one existing metric to a concrete decision. Do not invent performance results or change chart data. **Priority: P1.**

### 11. Integration — `/ai-systems-integration/`

**Observed:** a central Nexoris integration diagram connecting CRM, ERP, accounting, commerce, payments, and messaging.

**Improve:** keep the diagram and its interactions but replace excessive central glow with clear direction, relationship labels, and quieter nodes. Readers should understand what moves between systems rather than merely see a connected network.

**Images:** use a schematic of one record moving through the relevant systems. A cleaned, redacted integration map is more appropriate than server racks or unrelated people. Avoid suggesting named vendor partnerships through unverified logos.

**Section:** an “Example record journey” alongside the existing staged approach. Preserve the integration illustration's controls. **Priority: P1.**

### 12. AI readiness — `/data-infrastructure-ai-readiness/`

**Observed:** Before audit/After Nexoris comparison and readiness score, then groundwork, outcomes, and process.

**Improve:** distinguish comparison controls, score, data issues, and explanation. Reduce ornamental badges and use readable row labels. Label the demonstration as an illustrative example where necessary so the score is not interpreted as the visitor's actual assessment.

**Images:** add a redacted data-quality report or dictionary sample within “The groundwork we do.” Use a clean pipeline/ownership diagram, not a glowing brain or futuristic data centre.

**Section:** a small “What the audit delivers” artifact block using existing audit, remediation, and governance commitments. Preserve scores and toggle behaviour. **Priority: P1.**

### 13. IoT — `/iot-development/`

**Observed:** Fleet/Cold room/Line monitoring tabs with readings and vehicle statuses; no physical-world photography.

**Improve:** retain all modes; make units, thresholds, timestamps, and status labels visually clear. Reduce the decorative histogram treatment where it distracts from the selected use case.

**Images:** add a real sensor installation or Black African technician working on a relevant truck, cold-room probe, or machine. Place it in “From the device to the dashboard” and accompany it with a simple device → connection → platform diagram. Do not pair a fleet story with an unrelated smart-home photograph.

**Section:** one annotated physical deployment example. Preserve the monitoring demonstration. **Priority: P1.**

### 14. GovTech service — `/govtech-platforms/`

**Observed:** counter/portal comparison with permit status sequence, architecture, AI, delivery, and related sectors.

**Improve:** retain the useful status comparison. Make status text and timestamps easier to read, give the workflow a sober civic-service treatment, and avoid a celebratory badge at every step. Keep illustrative timelines distinct from procurement commitments.

**Images:** show a Black African citizen using a service terminal or an officer reviewing a digital application. Place it beside public-service delivery, not in a generic boardroom scene. Avoid official seals or implied agency endorsement without authorization.

**Section:** a compact citizen/staff journey tied to the existing platform scope. Preserve the counter/portal interaction. **Priority: P1.**

### 15. SEO and GEO — `/ai-seo-geo/`

**Observed:** a simulated search-result panel with Google, ChatGPT, Perplexity, and Gemini views, plus content/technical services and process.

**Improve:** keep the platform selector; make the panel read as an example rather than verified current search placement. Reduce tiny citations and decorative search chrome. A clear example label is essential if the responses are illustrative.

**Images:** place an approved content brief, content architecture map, or redacted performance report beside the actual service explanation. A working editorial session with Black African strategists can support content creation. Avoid random AI logos as the main visual identity.

**Section:** technical structure → useful content → measurement as a single annotated strip inside the existing process. Preserve all tabs and links; do not change recommendation logic. **Priority: P1, with P0 provenance review of displayed proof-like claims.**

### 16. Managed operations — `/managed-technology-operations/`

**Observed:** a “live” platform-health demonstration, metric tiles, incident log, three coverage levels, and monthly process.

**Improve:** soften the presentation of the illustrative operations log, increase contrast, and distinguish operational status from marketing promises. Make the existing Standard/Priority/Enterprise content a legible side-by-side service comparison with consistent rows.

**Images:** add a redacted monthly service report or an incident timeline. A small genuine photograph of a Black African engineer reviewing monitoring is appropriate beside ongoing support, but is optional.

**Section:** “What a monthly review looks like,” using existing reporting/improvement scope. Preserve plan terms, uptime figures, and widget behaviour until their owners explicitly approve any content changes. **Priority: P1.**

## 17–36. Individual industry pages

All twenty originally rely on the same text-led hero, pain-point cards, solution list, interactive finder, outcomes, and FAQ rhythm. Keep sector copy and finder behavior. Use a calmer split hero, a specific workplace scene, a readable solution sequence, and CMS-driven evidence only when published. Do not add artificial results or testimonials. The image directions below are implemented as labelled illustrative AI photographs; outcome copy remains the existing approved content.

| Page | Specific image direction and layout emphasis |
| --- | --- |
| `/education-software/` | School administrator handling records with a colleague; connect the scene to fees, attendance, and school administration, not a generic classroom stock image. |
| `/healthcare-software/` | Black clinicians reviewing a workstation in a clinic; emphasize staff workflow and records, avoiding visible patient data or sensational treatment imagery. |
| `/hospitality-software/` | Hotel reception staff helping a guest; show the service setting and connect bookings, rooms, and guest care. |
| `/restaurant-software/` | Restaurant team coordinating orders at the service counter; connect ordering, kitchen handoff, and stock. |
| `/retail-ecommerce-software/` | Retail operator checking stock in a real shop; connect physical inventory and online orders. |
| `/real-estate-software/` | Property professional and client reviewing a property; reinforce enquiry-to-viewing workflow without luxury imagery unrelated to the service. |
| `/logistics-software/` | Dispatcher working beside an active loading operation; balance fleet visibility with real delivery work. |
| `/fintech-software/` | Financial operations team reviewing software at a workstation; avoid floating currency symbols and neon trading imagery. |
| `/insurance-software/` | Claims professional helping a customer with records; foreground clarity and service rather than generic handshakes. |
| `/manufacturing-software/` | Engineer checking a production workstation on a factory floor; connect downtime, maintenance, and production visibility. |
| `/agritech-software/` | Agricultural professional using a tablet in cultivated farmland; connect operational data with actual growing conditions. |
| `/professional-services-software/` | Professional team reviewing documents and workflow; connect billable work, matters, and client records. |
| `/church-management-software/` | Church administrative team preparing attendance or activity records; show administration respectfully, without fabricated congregation testimony. |
| `/ngo-software/` | Programme officers reviewing field information; connect reporting and delivery without exploitative beneficiary photography. |
| `/government-digital-solutions/` | Civil-service staff assisting a citizen at a service desk; connect the public-facing process with the existing solution scope. |
| `/construction-software/` | Site professionals reviewing plans and a tablet; connect site progress, costs, and coordination. |
| `/media-entertainment-software/` | Media production team in an editing workspace; connect content operations and distribution, not random celebrity imagery. |
| `/fitness-wellness-software/` | Wellness/gym operator helping a member at reception; relate imagery to bookings, memberships, and repeat visits. |
| `/automotive-software/` | Workshop team reviewing a job alongside a vehicle; show service operations, parts, and customer workflow. |
| `/events-software/` | Event staff managing guest check-in; reinforce ticketing and admission without fake sponsor metrics. |

No extra static case-study section is appropriate for any of these pages. CMS publication and industry assignment must control whether evidence is shown. Shared template improvements apply to each of the twenty routes, with individual image subjects rather than one reused generic scene.

## 37–51. Editorial, company, legal, author, and Oge pages

| Page | Audit recommendation and implementation boundary |
| --- | --- |
| `/insights/` | Use a quieter editorial index, consistent cover ratios, shorter excerpts, and clear reading links. Distinguish empty library from no search matches. Keep search, categories, pagination, and newsletter behavior. Implemented in the shared presentation; URL search query is honored. |
| `/careers/` | Make the no-vacancies state intentional and preserve genuine recruiting content. Add a relevant collaboration scene beside the culture story; never imply generated people are actual staff. Implemented; jobs remain CMS-driven. |
| `/privacy-policy/` | Prioritize readable legal text, a compact contents list, and reliable anchors. Remove duplicate numbering caused by numbered headings inside a numbered list. Implemented without changing policy wording. |
| `/terms-of-service/` | Apply the same restrained legal reading system and contents treatment. Keep all terms and heading order. Implemented without editing legal text. |
| `/cookie-policy/` | Apply the same legal typography and contents treatment, keeping consent controls and policy text intact. Implemented. |
| `/insights/website-cost-in-nigeria/` | Improve long-form reading width, tables, author credits, and contents navigation. Dense pricing labels baked into graphics should become native accessible tables; replacement is CMS editorial work. |
| `/insights/hospital-management-system-nigeria/` | Keep the relevant healthcare setting; make lengthy comparisons and tables easier to scan and scroll on mobile. Shared reading/table changes implemented; medical/regulatory claims remain editorial content. |
| `/insights/best-software-development-companies-nigeria/` | Use clearer comparison hierarchy, restrained cards, and readable contents. Ranking evidence and dated company claims need editorial maintenance; do not fabricate proof through design. Shared renderer changes implemented. |
| `/insights/hidden-cost-of-bad-ux/` | Preserve the relevant workplace context, improve text rhythm, and reduce repeated author furniture. Shared typography and credit changes implemented; any new quantitative chart needs sourced data in CMS. |
| `/insights/ai-chatbot-for-nigerian-businesses/` | Replace neon chatbot metaphors with a grounded customer-support workflow photograph or an accurate interface example selected in CMS. Reading layout is implemented; existing CMS cover remains. |
| `/insights/custom-erp-software/` | Improve comparison tables, section spacing, and contents navigation. Prefer operational software/workplace imagery to generic futuristic tech. Renderer improvements implemented; CMS image choices remain editable. |
| `/insights/lagos-cybersecurity-guidelines-2026/` | Replace glowing-shield imagery with a sober systems/security operations scene. Present any legal requirements with editorially verified sources. Shared reading improvements implemented; cover and claims are not silently rewritten. |
| `/insights/ai-personalization-roi/` | Move text-heavy ROI visuals into accessible native charts/tables with sources and units. Use a relevant analytics/editorial scene as a cover if needed. Shared presentation improved; embedded CMS graphics remain editorial work. |
| `/chinedu-nwogu/` | Retain the real portrait. Simplify portrait glow, improve biography reading width, decode visible contents entities, and use consistent article cards. Implemented; profile schema is one coherent page identity. |
| `/oge/` | Replace implementation-facing palette/size specimens with customer-relevant example questions and contact guidance. Retain the actual Oge avatar and launch interaction. Implemented, with page schema and discovery inclusion. |

## Conditional templates and global states

Case-study detail pages must retain CMS covers, summaries, body media, and publication state. Their metadata now uses correct image properties and absolute URLs. No case-study record was fabricated to fill the empty collection.

Vacancy detail pages must render CMS job descriptions consistently and emit a complete page graph around JobPosting. HTML and Markdown descriptions remain supported. No vacancy was invented for testing.

Generated SEO pages must use the common readable body/table system and coherent page/service/FAQ/breadcrumb graph. Their body and questions stay CMS-owned; breadcrumbs must describe real navigation.

The not-found page retains clear recovery links and a real 404 response with noindex. Error and submission states were source-reviewed; causing production-like failures or submitting messages was not necessary for design validation. Floating navigation, consent, contact, and Oge controls keep their existing actions, with quieter visual treatment and usable target sizes.

## Final implementation record

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for completed code changes, CMS boundaries, checks, and remaining editorial recommendations. The retained homepage image is an explicit user override of any earlier replacement art direction.
