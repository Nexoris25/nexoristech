/**
 * Curated marketing photography for the Nexoris Technologies site (Stage 12 redesign).
 *
 * Every image is from Unsplash under its free commercial licence (no attribution required) and
 * was URL-verified before use. Helpers build optimised, sized URLs; next/image handles the rest.
 * Alt text is written for screen readers, never keyword stuffing (PRD 15).
 */

const BASE = "https://images.unsplash.com/photo-";

/** Build a sized, auto-format, cropped Unsplash URL for a given photo id. */
export function img(id: string, width = 1200): string {
  return `${BASE}${id}?w=${width}&q=80&auto=format&fit=crop`;
}

export interface Photo {
  id: string;
  alt: string;
}

/** The hero companion visual: a focused product team at work. */
export const heroPhoto: Photo = {
  id: "1521737711867-e3b97375f902",
  alt: "A team of colleagues planning software together around a laptop",
};

/** A wide band image for company and process contexts. */
export const teamPhoto: Photo = {
  id: "1600880292203-757bb62b4baf",
  alt: "Colleagues in a bright meeting room reviewing work on a screen",
};

export const workspacePhoto: Photo = {
  id: "1497366754035-f200968a6e72",
  alt: "A calm modern office workspace",
};

/** Imagery per industry group heading, keyed exactly to the catalogue groups. */
export const industryGroupPhotos: Record<string, Photo> = {
  "Commerce and consumer": {
    id: "1556742049-0cfed4f6a45d",
    alt: "A shopper paying at a retail counter",
  },
  "Health and people": {
    id: "1576091160550-2173dba999ef",
    alt: "A clinician using a tablet in a healthcare setting",
  },
  "Operations and assets": {
    id: "1605810230434-7631ac76ec81",
    alt: "An operations team monitoring live data on large screens",
  },
  "Public and purpose": {
    id: "1522202176988-66273c2fd55f",
    alt: "People collaborating around a shared table",
  },
};

/** A neutral fallback used if a group has no specific photo. */
export const fallbackPhoto: Photo = workspacePhoto;
