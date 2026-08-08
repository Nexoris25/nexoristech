/**
 * Naira amount in words for invoices, an international invoicing convention. Handles values up to
 * the billions and renders kobo when present. Pure and dependency-free.
 */
const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const SCALES = ["", "Thousand", "Million", "Billion", "Trillion"];

function threeDigits(n: number): string {
  const parts: string[] = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds > 0) parts.push(`${ONES[hundreds]} Hundred`);
  if (rest > 0) {
    if (rest < 20) parts.push(ONES[rest]!);
    else {
      const t = TENS[Math.floor(rest / 10)]!;
      const o = rest % 10;
      parts.push(o > 0 ? `${t} ${ONES[o]}` : t);
    }
  }
  return parts.join(" ");
}

function whole(n: number): string {
  if (n === 0) return "Zero";
  const groups: number[] = [];
  let rest = n;
  while (rest > 0) {
    groups.push(rest % 1000);
    rest = Math.floor(rest / 1000);
  }
  const words: string[] = [];
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    const g = groups[i]!;
    if (g === 0) continue;
    words.push(`${threeDigits(g)}${SCALES[i] ? ` ${SCALES[i]}` : ""}`);
  }
  return words.join(" ");
}

export function nairaInWords(amount: number): string {
  const safe = Math.max(0, amount);
  const naira = Math.floor(safe);
  const kobo = Math.round((safe - naira) * 100);
  const nairaWords = `${whole(naira)} Naira`;
  if (kobo > 0) return `${nairaWords} and ${whole(kobo)} Kobo only`;
  return `${nairaWords} only`;
}
