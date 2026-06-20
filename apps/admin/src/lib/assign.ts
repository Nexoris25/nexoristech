/**
 * Deterministic lead-assignment selection (PRD 2.3): round-robin modified by industry affinity and
 * capacity caps. Pure so it is unit tested; the action layer supplies live staff and open-lead
 * counts. Working-hours awareness (queueing overnight leads for the morning) is applied by the
 * caller. A salesperson at or over capacity is skipped; among the rest, those whose industries
 * match the lead come first, then the lightest load, then a stable tiebreak by id.
 */
export interface AssigneeCandidate {
  id: string;
  industries: string[];
  openCount: number;
  capacityCap: number | null;
}

export function chooseAssignee(
  candidates: readonly AssigneeCandidate[],
  leadIndustry: string | undefined,
): string | null {
  const available = candidates.filter(
    (c) => c.capacityCap === null || c.openCount < c.capacityCap,
  );
  if (available.length === 0) return null;

  const hasAffinity = (c: AssigneeCandidate): boolean =>
    leadIndustry !== undefined && c.industries.includes(leadIndustry);

  const ranked = [...available].sort((a, b) => {
    const affinityDelta = Number(hasAffinity(b)) - Number(hasAffinity(a));
    if (affinityDelta !== 0) return affinityDelta;
    if (a.openCount !== b.openCount) return a.openCount - b.openCount;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return ranked[0]?.id ?? null;
}
