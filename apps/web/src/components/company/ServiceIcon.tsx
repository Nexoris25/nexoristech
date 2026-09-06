import {
  PanelsTopLeft,
  Bot,
  Cog,
  ShoppingCart,
  ChartNoAxesCombined,
  Cable,
  Database,
  RadioTower,
  FileCheck2,
  SearchCheck,
  ServerCog,
  type LucideIcon,
} from "lucide-react";
/** Stable service identities. Keys also drive the existing finder; scoring is unchanged. */
export const serviceIcons: Record<string, LucideIcon> = {
  cube: PanelsTopLeft,
  chat: Bot,
  gear: Cog,
  cart: ShoppingCart,
  chart: ChartNoAxesCombined,
  nodes: Cable,
  db: Database,
  sensor: RadioTower,
  bank: FileCheck2,
  search: SearchCheck,
  shield: ServerCog,
};
export function ServiceIcon({ name }: { name: string }) {
  const Icon = serviceIcons[name];
  return Icon ? <Icon size={24} strokeWidth={1.6} aria-hidden="true" /> : null;
}
