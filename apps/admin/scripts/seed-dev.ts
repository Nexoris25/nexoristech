/**
 * Local development seed: a handful of clearly-sample leads so the dashboard and CRM screens have
 * data to render while developing. Refuses to run against anything but localhost, so it can never
 * put sample data into the production database.
 *
 * Run with: DATABASE_URL_ADMIN=postgres://...localhost... pnpm --filter @nexoris/admin db:seed:dev
 */
import pg from "pg";

const { Client } = pg;

interface SeedLead {
  source: string;
  page: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  message: string;
  finder: object | null;
  score: number;
  band: "Hot" | "Warm" | "Cold";
  justification: string;
  status: string;
  daysAgo: number;
}

const LEADS: SeedLead[] = [
  {
    source: "contact-form",
    page: "/contact",
    name: "Adaeze Okonkwo",
    email: "adaeze@sampleclinic.test",
    phone: "+2348030000001",
    company: "Sample Clinic (seed data)",
    message:
      "We run a clinic in Lekki and patients keep calling to book appointments. We want online booking, reminders, and a patient record system. We have budget approved for this quarter.",
    finder: null,
    score: 86,
    band: "Hot",
    justification:
      "Strong fit for Healthcare and Clinics with a named, funded project: online booking, reminders, and patient records map directly to AI Product Development and Business Process Automation. The message names a location, a timeline, and an approved budget, which are strong intent signals. Came through the contact form on /contact with complete details.",
    status: "New",
    daysAgo: 0,
  },
  {
    source: "solution-finder",
    page: "/retail-ecommerce-software",
    name: "Tunde Bakare",
    email: "tunde@samplestores.test",
    phone: null,
    company: "Sample Stores (seed data)",
    message:
      "Finder answers: sell more online and take payments. We have two shops in Ibadan and want to sell nationwide.",
    finder: {
      headache: "sell-online",
      recommendation: [
        { slug: "ai-ecommerce-development", label: "AI E-Commerce", href: "/ai-ecommerce-development" },
      ],
    },
    score: 68,
    band: "Warm",
    justification:
      "Good fit for Retail and E-Commerce: the Solution Finder answers point at AI E-Commerce, and the message names two physical shops wanting to sell nationwide. No budget or timeline shared yet, so intent is real but early. Came through the Solution Finder on the retail industry page.",
    status: "Contacted",
    daysAgo: 2,
  },
  {
    source: "oge-chat",
    page: "/logistics-software",
    name: "Ngozi Eze",
    email: "ngozi@samplehaulage.test",
    phone: "+2348030000003",
    company: "Sample Haulage (seed data)",
    message:
      "Chat transcript: asked whether Nexoris Technologies can track 12 trucks live and alert when a truck goes off route. Asked about IoT hardware costs and installation time.",
    finder: null,
    score: 74,
    band: "Hot",
    justification:
      "Clear fit for Logistics and Supply Chain with a concrete, sized problem: live tracking for a named fleet of 12 trucks with off-route alerts, which maps to IoT Development and Data Dashboards and Analytics. Asked practical questions about cost and installation, a strong buying signal. Came through Oge chat on the logistics industry page.",
    status: "Qualified",
    daysAgo: 4,
  },
  {
    source: "contact-form",
    page: "/ai-seo-geo",
    name: "Ibrahim Musa",
    email: "ibrahim@samplefirm.test",
    phone: null,
    company: null,
    message: "How much do you charge for SEO? Just comparing prices for now.",
    finder: null,
    score: 34,
    band: "Cold",
    justification:
      "Early-stage price comparison with no company, industry, or project detail shared. The interest in AI Content, SEO and GEO is genuine but the message signals research rather than a decision. Came through the contact form on the SEO service page; worth a helpful reply and a nurture date.",
    status: "New",
    daysAgo: 1,
  },
  {
    source: "referral",
    page: "/",
    name: "Chiamaka Obi",
    email: "chiamaka@samplefintech.test",
    phone: "+2348030000005",
    company: "Sample Fintech (seed data)",
    message:
      "Referred by an existing client. We need a customer dashboard for our savings product and our support team is drowning in WhatsApp messages. Want to talk this week.",
    finder: null,
    score: 91,
    band: "Hot",
    justification:
      "Referral from an existing client, historically the highest-converting source, with two named problems: a customer dashboard for a savings product and support automation, mapping to AI Product Development and AI Chatbots and Virtual Assistants for Financial Services and Fintech. Asked to talk this week, a clear timeline signal.",
    status: "Scoping Call Booked",
    daysAgo: 3,
  },
  {
    source: "solution-finder",
    page: "/education-software",
    name: "Folake Adeyemi",
    email: "folake@sampleschool.test",
    phone: null,
    company: "Sample School (seed data)",
    message:
      "Finder answers: cut out repetitive manual work. We manage 800 students on paper and spreadsheets.",
    finder: {
      headache: "duplicate-data",
      recommendation: [
        { slug: "business-process-automation", label: "Business Process Automation", href: "/business-process-automation" },
      ],
    },
    score: 57,
    band: "Warm",
    justification:
      "Fit for Education and EdTech: 800 students managed on paper and spreadsheets is exactly the manual-work problem Business Process Automation solves. The scale is named, which helps, but no timeline or budget was shared. Came through the Solution Finder on the education industry page.",
    status: "New",
    daysAgo: 0,
  },
];

async function run(): Promise<void> {
  const connectionString = process.env.DATABASE_URL_ADMIN ?? "";
  if (!/localhost|127\.0\.0\.1/.test(connectionString)) {
    throw new Error(
      "seed-dev only runs against a localhost database. Set DATABASE_URL_ADMIN to your local instance.",
    );
  }
  const client = new Client({ connectionString });
  await client.connect();
  try {
    for (const lead of LEADS) {
      const exists = await client.query("SELECT 1 FROM lead WHERE email = $1", [lead.email]);
      if (exists.rows.length > 0) continue;
      await client.query(
        `INSERT INTO lead
           (source, page, name, email, phone, company, message, finder, score, band,
            justification, scored_by, status, created_at, sla_due_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'rules',$12,
                 now() - ($13 || ' days')::interval,
                 now() - ($13 || ' days')::interval + interval '1 day')`,
        [
          lead.source,
          lead.page,
          lead.name,
          lead.email,
          lead.phone,
          lead.company,
          lead.message,
          lead.finder ? JSON.stringify(lead.finder) : null,
          lead.score,
          lead.band,
          lead.justification,
          lead.status,
          String(lead.daysAgo),
        ],
      );
    }
    const { rows } = await client.query<{ count: string }>("SELECT count(*) FROM lead");
    console.log(`Dev leads ready. Lead table now holds ${rows[0]?.count} rows.`);
  } finally {
    await client.end();
  }
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
