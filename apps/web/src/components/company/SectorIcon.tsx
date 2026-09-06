import {
  GraduationCap,
  Stethoscope,
  Hotel,
  UtensilsCrossed,
  ShoppingBasket,
  Building2,
  Truck,
  Landmark,
  ShieldCheck,
  Factory,
  Sprout,
  BriefcaseBusiness,
  Church,
  HeartHandshake,
  University,
  HardHat,
  Clapperboard,
  Dumbbell,
  CarFront,
  Tickets,
  type LucideIcon,
} from "lucide-react";

/** One distinct glyph per industry. Reuse only for the same destination. */
export const sectorIcons: Record<string, LucideIcon> = {
  "education-software": GraduationCap,
  "healthcare-software": Stethoscope,
  "hospitality-software": Hotel,
  "restaurant-software": UtensilsCrossed,
  "retail-ecommerce-software": ShoppingBasket,
  "real-estate-software": Building2,
  "logistics-software": Truck,
  "fintech-software": Landmark,
  "insurance-software": ShieldCheck,
  "manufacturing-software": Factory,
  "agritech-software": Sprout,
  "professional-services-software": BriefcaseBusiness,
  "church-management-software": Church,
  "ngo-software": HeartHandshake,
  "government-digital-solutions": University,
  "construction-software": HardHat,
  "media-entertainment-software": Clapperboard,
  "fitness-wellness-software": Dumbbell,
  "automotive-software": CarFront,
  "events-software": Tickets,
};
export function SectorIcon({ href }: { href: string }) {
  const Icon = sectorIcons[href.replace(/^\/+|\/+$/g, "")];
  return Icon ? <Icon size={24} strokeWidth={1.6} aria-hidden="true" /> : null;
}
