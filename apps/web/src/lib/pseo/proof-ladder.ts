/**
 * The proof substitution ladder for programmatic pages (PRD 9.6). The proof area never renders
 * empty and never fabricates: it takes the highest real tier available for a page and labels each
 * item honestly. Tiers, highest first:
 *   1. exact   - real client proof tagged to this exact industry or location.
 *   2. adjacent- real client proof from an adjacent industry, labelled as adjacent.
 *   3. in-house- the real Nexoris Technologies products (Covyvo, GLEEN), genuine first-hand proof.
 *   4. capability - day-one truths: the stack, the local-fit, and the written-scope and ownership
 *      commitments, presented as what we do rather than as a client result.
 * In-house and capability proof are always available, so a page always carries honest credibility
 * from launch. As real tagged proof is added, it automatically replaces the lower tiers.
 */
export type ProofTier = "exact" | "adjacent" | "in-house";

export interface ProofItem {
  /** Honest label for what this item is. */
  label: string;
  detail: string;
}

/** A real client proof item, tagged to an industry and optionally a location. */
export interface ClientProof {
  detail: string;
  industry: string;
  location?: string;
}

export interface ProofLadderInput {
  industryLabel: string;
  techLabel: string;
  location?: string;
  /** Real client proof tagged to this exact industry (and location, if a location page). */
  exact?: ClientProof[];
  /** Real client proof from an adjacent industry, honestly labelled. */
  adjacent?: ClientProof[];
}

export interface ProofBlock {
  tier: ProofTier;
  /** The honest items to render, in order. Never empty. */
  items: ProofItem[];
}

/** The real Nexoris Technologies in-house products (PRD 9.6, 1.7). No outbound links until live. */
const IN_HOUSE_PRODUCTS: ProofItem[] = [
  {
    label: "Our product: Covyvo",
    detail:
      "Covyvo is our own payroll and e-invoicing product for Nigerian SMEs, built and run by Nexoris Technologies.",
  },
  {
    label: "Our product: GLEEN",
    detail:
      "GLEEN is our own exam preparation product, built and run by Nexoris Technologies.",
  },
];

/** Day-one capability proof, true before any client case study, parameterised to the page. */
function capabilityProof(input: ProofLadderInput): ProofItem[] {
  return [
    {
      label: "How we build it",
      detail: `For ${input.techLabel} in ${input.industryLabel}, we build offline-first where the network is unreliable and integrate the local payment gateways your customers already use, such as Paystack, Flutterwave, and Interswitch.`,
    },
    {
      label: "What you can count on",
      detail:
        "Every project gets a written scope with honest numbers before work starts, and everything we deliver belongs to you, completely.",
    },
  ];
}

function clientItems(proof: ClientProof[], adjacent: boolean): ProofItem[] {
  return proof.map((p) => ({
    label: adjacent
      ? `A similar project in ${p.industry}`
      : `Our work in ${p.industry}`,
    detail: p.detail,
  }));
}

/** Resolve the proof block for a page from the highest available real tier. Never empty. */
export function resolveProof(input: ProofLadderInput): ProofBlock {
  if (input.exact && input.exact.length > 0) {
    return { tier: "exact", items: clientItems(input.exact, false) };
  }
  if (input.adjacent && input.adjacent.length > 0) {
    return { tier: "adjacent", items: clientItems(input.adjacent, true) };
  }
  return {
    tier: "in-house",
    items: [...IN_HOUSE_PRODUCTS, ...capabilityProof(input)],
  };
}
