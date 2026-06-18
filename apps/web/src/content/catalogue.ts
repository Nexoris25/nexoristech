/**
 * The navigation catalogue for the Nexoris Technologies header and footer (PRD 7.2 to 7.4,
 * 7.8). Service flyout labels and one-line descriptions, the industries grouped into four
 * columns, the Company dropdown, and the footer groupings. Labels are the approved
 * navigation strings.
 */

export interface NavItem {
  label: string;
  href: string;
  summary?: string;
}

/** Services in the flyout order of importance (column 1 then column 2). */
export const servicesColumnOne: NavItem[] = [
  {
    label: "AI Product Development",
    href: "/ai-product-development",
    summary: "Websites, apps, and custom software, built around your business",
  },
  {
    label: "AI Chatbots and Virtual Assistants",
    href: "/ai-chatbots-virtual-assistants",
    summary: "Answer customers any time, on your website or WhatsApp",
  },
  {
    label: "Business Process Automation",
    href: "/business-process-automation",
    summary: "Let software handle the repetitive work",
  },
  {
    label: "AI E-Commerce",
    href: "/ai-ecommerce-development",
    summary: "Online stores that sell more, day and night",
  },
  {
    label: "Data Dashboards and Analytics",
    href: "/data-dashboards-predictive-analytics",
    summary: "See your numbers live and know what is coming",
  },
];

export const servicesColumnTwo: NavItem[] = [
  {
    label: "AI and Systems Integration",
    href: "/ai-systems-integration",
    summary: "Make the tools you already use share data automatically",
  },
  {
    label: "Data Infrastructure and AI Readiness",
    href: "/data-infrastructure-ai-readiness",
    summary: "Clean up your data so reports and AI give right answers",
  },
  {
    label: "IoT Development",
    href: "/iot-development",
    summary: "Track your vehicles, machines, and cold rooms live",
  },
  {
    label: "GovTech Platforms",
    href: "/govtech-platforms",
    summary: "Digital services for government and public agencies",
  },
  {
    label: "AI Content, SEO and GEO",
    href: "/ai-seo-geo",
    summary: "Get found on Google and inside AI tools like ChatGPT",
  },
  {
    label: "Managed Technology Operations",
    href: "/managed-technology-operations",
    summary: "We keep your software running and improving after launch",
  },
];

/** All 11 services in flyout order, for the footer services column. */
export const allServices: NavItem[] = [
  ...servicesColumnOne,
  ...servicesColumnTwo,
];

export const servicesFeatured = {
  text: "Not sure which one you need? Tell us what is going on in your business and we will point you to the right place.",
  cta: { label: "Find the right service", href: "/contact" },
};

/** Industries grouped into four columns (PRD 7.3). */
export interface IndustryGroup {
  heading: string;
  items: NavItem[];
}

export const industryGroups: IndustryGroup[] = [
  {
    heading: "Commerce and consumer",
    items: [
      { label: "Retail and E-Commerce", href: "/retail-ecommerce-software" },
      { label: "Restaurants and QSR", href: "/restaurant-software" },
      { label: "Hospitality and Short-Lets", href: "/hospitality-software" },
      { label: "Real Estate", href: "/real-estate-software" },
      { label: "Automotive", href: "/automotive-software" },
      { label: "Events and Weddings", href: "/events-software" },
      {
        label: "Media and Entertainment",
        href: "/media-entertainment-software",
      },
    ],
  },
  {
    heading: "Health and people",
    items: [
      { label: "Healthcare and Clinics", href: "/healthcare-software" },
      { label: "Education and EdTech", href: "/education-software" },
      {
        label: "Fitness, Beauty and Wellness",
        href: "/fitness-wellness-software",
      },
      {
        label: "Professional Services",
        href: "/professional-services-software",
      },
      { label: "Insurance", href: "/insurance-software" },
    ],
  },
  {
    heading: "Operations and assets",
    items: [
      { label: "Logistics and Supply Chain", href: "/logistics-software" },
      { label: "Manufacturing", href: "/manufacturing-software" },
      { label: "Construction and Engineering", href: "/construction-software" },
      { label: "Agriculture and Agritech", href: "/agritech-software" },
      { label: "Financial Services and Fintech", href: "/fintech-software" },
    ],
  },
  {
    heading: "Public and purpose",
    items: [
      {
        label: "Government and Public Sector",
        href: "/government-digital-solutions",
      },
      { label: "NGOs and Non-Profits", href: "/ngo-software" },
      { label: "Faith Organisations", href: "/church-management-software" },
    ],
  },
];

export const industriesFeatured = {
  text: "Your exact business is not listed? Tell us what you do. The thinking travels well.",
  cta: { label: "Talk to us", href: "/contact" },
};

/** Company dropdown (PRD 7.4). */
export const companyLinks: NavItem[] = [
  { label: "About Us", href: "/about" },
  { label: "How We Work", href: "/how-we-work" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

/** The top 10 industries by expected demand, for the footer (PRD 7.8). */
export const footerTopIndustries: NavItem[] = [
  { label: "Education", href: "/education-software" },
  { label: "Healthcare", href: "/healthcare-software" },
  { label: "Fintech", href: "/fintech-software" },
  { label: "Retail and E-Commerce", href: "/retail-ecommerce-software" },
  { label: "Logistics", href: "/logistics-software" },
  { label: "Real Estate", href: "/real-estate-software" },
  { label: "Hospitality", href: "/hospitality-software" },
  { label: "Restaurants", href: "/restaurant-software" },
  { label: "Government", href: "/government-digital-solutions" },
  { label: "Manufacturing", href: "/manufacturing-software" },
];

/** Footer company column (PRD 7.8). */
export const footerCompanyLinks: NavItem[] = [
  { label: "About Us", href: "/about" },
  { label: "How We Work", href: "/how-we-work" },
  { label: "Case Studies", href: "/case-studies" },
  { label: "Insights", href: "/insights" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

/** The WhatsApp click-to-chat link for the supplied number. */
export const WHATSAPP_HREF = "https://wa.me/2349138133224";
