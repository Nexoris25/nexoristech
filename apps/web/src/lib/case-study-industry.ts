import { INDUSTRIES } from "@nexoris/recommend";
import type { CaseStudyCard } from "./cms.js";

const normalise = (value: string): string => value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
/** CMS Industry is currently free text. Match whole labels/aliases, never substring guesses. */
export function caseStudiesForIndustry(studies: CaseStudyCard[], slug: string, limit = 3): CaseStudyCard[] {
  const sector = INDUSTRIES.find(i => i.slug === slug);
  if (!sector) return [];
  const aliases = [sector.label, sector.slug, sector.slug.replace(/-software$/, "").replace(/-/g, " "), ...sector.label.split(/ and |, /)];
  if (slug === "church-management-software") aliases.push("Church", "Church Management", "Religious and Faith");
  if (slug === "government-digital-solutions") aliases.push("Government", "Public Sector", "GovTech");
  if (slug === "ngo-software") aliases.push("NGO", "NGOs", "Non Profit", "Non Profits");
  const accepted = new Set(aliases.map(normalise));
  return studies.filter(study => study.industry && accepted.has(normalise(study.industry))).slice(0, limit);
}
