/**
 * A mechanical guard against invented figures.
 *
 * The prompt forbids inventing prices, metrics and terms, and the prompt is not enough. Asked for a
 * refund policy, against a knowledge base in which the word "refund" does not appear once, the
 * assistant stated one: "we do not offer refunds for services we provide". A rule was added, the
 * wording became more careful, and the underlying behaviour, answering from what sounds reasonable
 * when the pages are silent, did not change.
 *
 * A caution for whoever reads this next, because it cost time here. Sounding invented is not
 * evidence of being invented. The same assistant answers "each plan includes a clear uptime target,
 * such as 99.5%, 99.9%, or 24/7 monitoring", which reads exactly like a fabricated service level and
 * is quoted almost verbatim from the maintenance page: Standard 99.5%, Priority 99.9%, Enterprise
 * 24/7. It passes this guard, correctly. Check the source before calling something a fabrication.
 *
 * Retrieval cannot gate this either. Cosine distance to the nearest chunk does not separate a
 * question the knowledge base can answer from one it cannot: measured live, "who is the ceo of
 * nexoris" scores 0.589 and "how do i cook jollof rice" scores 0.629. Any floor strict enough to
 * catch the nonsense would refuse real questions first.
 *
 * What is decidable is whether a figure in the answer appears in the text the answer was grounded
 * in. That is a string comparison, not a judgement, and it catches the class of fabrication that
 * actually costs something: a price, a percentage, a service level. Only high-risk numeric forms
 * are checked, because a rule that also fired on "three questions" or "two weeks" would suppress
 * ordinary prose and would be turned off within a week:
 *
 *   * percentages, which is how uptime, discounts and metrics are stated;
 *   * currency amounts, which is how prices are stated;
 *   * bare numbers of four digits or more, which at that size are quantities, years or amounts
 *     rather than counts of anything in a sentence.
 *
 * Comparison ignores thousands separators and currency marks so that "500,000" in the answer is
 * matched by "500000" or "₦500,000" in the source. It deliberately does not attempt arithmetic: a
 * figure derived from two figures in the context is still a figure we never published.
 */

/** Digits only, so 1,500 / ₦1,500 / 1500 all compare equal. */
function digitsOf(token: string): string {
  return token.replace(/[^\d]/g, "");
}

// The decimal part requires a digit after the point, so a figure ending a sentence does not eat the
// full stop and get compared as "850,000." against a context that says "850,000".
const PERCENT = /\d[\d,]*(?:\.\d+)?\s*%/g;
const CURRENCY = /(?:₦|ngn|\$|usd|€|£)\s?\d[\d,]*(?:\.\d+)?/gi;
const LARGE = /\b\d[\d,]{3,}(?:\.\d+)?\b/g;

/**
 * The high-risk figures in a piece of text, as comparable digit strings paired with how they were
 * written (the original spelling is what a log or a test needs to be readable).
 */
export function figuresIn(text: string): { written: string; digits: string }[] {
  const found = new Map<string, { written: string; digits: string }>();
  // Ordered most specific first and keyed by digits, so "₦850,000" is reported once as a price
  // rather than twice, once as a price and again as a large number.
  for (const pattern of [PERCENT, CURRENCY, LARGE]) {
    for (const match of text.matchAll(pattern)) {
      const written = match[0].trim();
      const digits = digitsOf(written);
      const key = `${written.includes("%") ? "%" : ""}${digits}`;
      if (digits.length > 0 && !found.has(key)) found.set(key, { written, digits });
    }
  }
  return [...found.values()];
}

/**
 * The figures in `text` that do not appear in `context`.
 *
 * A percentage must be matched by the same digits appearing as a percentage in the context, so a
 * source that happens to mention 99 of something does not licence a claim of 99% uptime. Currency
 * and large numbers match on digits alone, because the same amount is written many ways.
 */
export function unsupportedFigures(text: string, context: string): string[] {
  const contextDigits = new Set(figuresIn(context).map((f) => f.digits));
  const contextPercents = new Set(
    [...context.matchAll(PERCENT)].map((m) => digitsOf(m[0])),
  );
  const unsupported: string[] = [];
  for (const figure of figuresIn(text)) {
    const isPercent = figure.written.includes("%");
    const supported = isPercent
      ? contextPercents.has(figure.digits)
      : contextDigits.has(figure.digits);
    if (!supported && !unsupported.includes(figure.written)) {
      unsupported.push(figure.written);
    }
  }
  return unsupported;
}

/**
 * Split streamed text into complete sentences, holding back the last partial one.
 *
 * The guard has to see a whole sentence to judge it, and the answer has to keep streaming, so the
 * stream runs one sentence behind rather than one answer behind. That is the difference between a
 * pause the visitor does not notice and the eight seconds of silence this replaced.
 *
 * Abbreviations are not special-cased. A false sentence break costs nothing here: both halves are
 * still checked and still emitted, in order.
 */
export class SentenceStream {
  private held = "";

  /** Complete sentences available after adding `chunk`. */
  push(chunk: string): string[] {
    this.held += chunk;
    const out: string[] = [];
    for (;;) {
      // A sentence ends at .!? or a blank line, whichever comes first: a bulleted list never
      // reaches a full stop and would otherwise be held to the end of the answer.
      const match = /[.!?](?=\s)|\n\n/.exec(this.held);
      if (!match) break;
      const end = match.index + match[0].length;
      out.push(this.held.slice(0, end));
      this.held = this.held.slice(end);
    }
    return out;
  }

  /** Whatever is left when the model stops. */
  flush(): string {
    const rest = this.held;
    this.held = "";
    return rest;
  }
}
