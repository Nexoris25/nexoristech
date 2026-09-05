/** Design-owned illustrative photography. Never use as a CMS cover, staff portrait or client proof. */
export interface ContextualImage { src: string; alt: string }
const photo = (name: string, alt: string): ContextualImage => ({ src: `/images/context/${name}.webp`, alt });
export const industryImages: Record<string, ContextualImage> = {
  "education-software": photo("education", "Admissions staff reviewing a student workflow on a laptop"),
  "healthcare-software": photo("healthcare", "A doctor and nurse reviewing a tablet at a hospital station"),
  "hospitality-software": photo("hospitality", "A hotel receptionist managing a guest booking"),
  "restaurant-software": photo("restaurant", "A chef checking incoming orders in a working restaurant kitchen"),
  "retail-ecommerce-software": photo("retail", "A shop owner scanning inventory in a retail stockroom"),
  "real-estate-software": photo("real-estate", "Property managers reviewing apartment plans on a tablet"),
  "logistics-software": photo("logistics", "A warehouse dispatcher scanning a parcel before delivery"),
  "fintech-software": photo("fintech", "Finance operations professionals reviewing transaction reconciliation"),
  "insurance-software": photo("insurance", "A claims officer reviewing vehicle damage documentation"),
  "manufacturing-software": photo("manufacturing", "An engineer reviewing production information beside a manufacturing line"),
  "agritech-software": photo("agritech", "An agronomist checking a soil moisture sensor in an irrigated field"),
  "professional-services-software": photo("professional-services", "Consultants reviewing project milestones and documents"),
  "church-management-software": photo("church", "Church volunteers coordinating a community event on a laptop"),
  "ngo-software": photo("ngo", "Programme officers reviewing a community water infrastructure project"),
  "government-digital-solutions": photo("government", "A public-service officer helping a citizen at a digital service desk"),
  "construction-software": photo("construction", "Construction professionals reviewing a tablet safely on site"),
  "media-entertainment-software": photo("media", "A video editor working on a production timeline"),
  "fitness-wellness-software": photo("wellness", "A fitness studio manager reviewing class bookings"),
  "automotive-software": photo("automotive", "An automotive technician reviewing a vehicle diagnostic tablet"),
  "events-software": photo("events", "An event coordinator scanning an attendee badge at conference check-in"),
};
export const productTeamImage = photo("product-team", "Designers and engineers reviewing interface wireframes together");
export const systemsImage = photo("systems", "A technology operations engineer inspecting network equipment");
export const serviceImages: Record<string, ContextualImage> = {
  "/ai-product-development": productTeamImage,
  "/ai-chatbots-virtual-assistants": industryImages["hospitality-software"]!,
  "/business-process-automation": industryImages["logistics-software"]!,
  "/ai-ecommerce-development": industryImages["retail-ecommerce-software"]!,
  "/data-dashboards-predictive-analytics": industryImages["fintech-software"]!,
  "/ai-systems-integration": systemsImage,
  "/data-infrastructure-ai-readiness": systemsImage,
  "/iot-development": industryImages["agritech-software"]!,
  "/govtech-platforms": industryImages["government-digital-solutions"]!,
  "/ai-seo-geo": productTeamImage,
  "/managed-technology-operations": systemsImage,
};
