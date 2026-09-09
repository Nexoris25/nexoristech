/** Design-owned illustrative photography. Never use as a CMS cover, staff portrait or client proof. */
export interface ContextualImage {
  src: string;
  alt: string;
}
const photo = (name: string, alt: string): ContextualImage => ({
  src: `/images/context/${name}.webp`,
  alt,
});
export const industryImages: Record<string, ContextualImage> = {
  "education-software": photo(
    "education",
    "Admissions staff reviewing a student workflow on a laptop",
  ),
  "healthcare-software": photo(
    "healthcare",
    "A doctor and nurse reviewing a tablet at a hospital station",
  ),
  "hospitality-software": photo(
    "hospitality",
    "A hotel receptionist managing a guest booking",
  ),
  "restaurant-software": photo(
    "restaurant",
    "A chef checking incoming orders in a working restaurant kitchen",
  ),
  "retail-ecommerce-software": photo(
    "retail",
    "A shop owner scanning inventory in a retail stockroom",
  ),
  "real-estate-software": photo(
    "real-estate",
    "Property managers reviewing apartment plans on a tablet",
  ),
  "logistics-software": photo(
    "logistics",
    "A warehouse dispatcher scanning a parcel before delivery",
  ),
  "fintech-software": photo(
    "fintech",
    "Finance operations professionals reviewing transaction reconciliation",
  ),
  "insurance-software": photo(
    "insurance",
    "A claims officer reviewing vehicle damage documentation",
  ),
  "manufacturing-software": photo(
    "manufacturing",
    "An engineer reviewing production information beside a manufacturing line",
  ),
  "agritech-software": photo(
    "agritech",
    "An agronomist checking a soil moisture sensor in an irrigated field",
  ),
  "professional-services-software": photo(
    "professional-services",
    "Consultants reviewing project milestones and documents",
  ),
  "church-management-software": photo(
    "church",
    "Church volunteers coordinating a community event on a laptop",
  ),
  "ngo-software": photo(
    "ngo",
    "Programme officers reviewing a community water infrastructure project",
  ),
  "government-digital-solutions": photo(
    "government",
    "A public-service officer helping a citizen at a digital service desk",
  ),
  "construction-software": photo(
    "construction",
    "Construction professionals reviewing a tablet safely on site",
  ),
  "media-entertainment-software": photo(
    "media",
    "A video editor working on a production timeline",
  ),
  "fitness-wellness-software": photo(
    "wellness",
    "A fitness studio manager reviewing class bookings",
  ),
  "automotive-software": photo(
    "automotive",
    "An automotive technician reviewing a vehicle diagnostic tablet",
  ),
  "events-software": photo(
    "events",
    "An event coordinator scanning an attendee badge at conference check-in",
  ),
};
export const productTeamImage = photo(
  "product-team",
  "Designers and engineers reviewing interface wireframes together",
);
export const serviceImages: Record<string, ContextualImage> = {
  "/ai-chatbots-virtual-assistants": photo(
    "support-desk",
    "A customer support specialist reviewing conversations and handoffs at her workstation",
  ),
  "/business-process-automation": photo(
    "workflow-automation",
    "Operations colleagues reviewing a purchase approval workflow and task queue",
  ),
  "/data-dashboards-predictive-analytics": photo(
    "business-analytics",
    "Operations analysts reviewing business trends and tabular data on a dashboard",
  ),
  "/data-infrastructure-ai-readiness": photo(
    "data-readiness",
    "Data specialists reviewing database relationships and validation indicators",
  ),
  "/ai-seo-geo": photo(
    "search-editorial",
    "A content strategist and search analyst planning topic groups and search content",
  ),
  /*
   * The previous image here was a server room — an engineer at a network rack. That is data-centre
   * hardware, and this page sells software maintenance: monitoring, patching, releases and support.
   * The picture now shows the work the six points beside it describe.
   */
  "/managed-technology-operations": photo(
    "managed-technology-operations",
    "Two engineers reviewing an application monitoring dashboard showing uptime, error rate and recently applied security patches",
  ),
};

/** Authentic photographs; source, photographer and license recorded in photography/CREDITS.md. */
export const developmentPhoto: ContextualImage = {
  src: "/images/photography/lagos-development.webp",
  alt: "A developer working on application code in a Lagos workspace",
};
