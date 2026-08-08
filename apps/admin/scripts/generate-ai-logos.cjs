/**
 * Generates src/components/cms/AiPlatformLogo.tsx from @lobehub/icons-static-svg.
 * The package is a build-time source only; the generated file is committed and the dependency removed,
 * so nothing is fetched at runtime and the brand marks are the official ones rather than approximations.
 */
const fs = require("fs");
const path = require("path");

const DIR = path.join(process.cwd(), "node_modules/@lobehub/icons-static-svg/icons");

// key = the slug used by PLATFORM_META; file = the official mark; colour variants where they exist.
const WANT = [
  ["chatgpt", "openai.svg", "ChatGPT", true],
  ["perplexity", "perplexity-color.svg", "Perplexity", false],
  ["gemini", "gemini-color.svg", "Gemini", false],
  ["claude", "claude-color.svg", "Claude", false],
  ["copilot", "copilot-color.svg", "Microsoft Copilot", false],
  ["notebooklm", "notebooklm.svg", "NotebookLM", true],
  ["mistral", "mistral-color.svg", "Mistral", false],
  ["deepseek", "deepseek-color.svg", "DeepSeek", false],
  ["grok", "grok.svg", "Grok", true],
  ["poe", "poe-color.svg", "Poe", false],
  ["phind", "phind.svg", "Phind", true],
  ["bing", "bing-color.svg", "Microsoft Bing", false],
  ["metaai", "metaai-color.svg", "Meta AI", false],
  ["huggingface", "huggingface-color.svg", "Hugging Face", false],
];

function inner(svg, key) {
  let body = svg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  body = body.replace(/<title>[\s\S]*?<\/title>/g, "");
  // Gradient/clip ids are global in the document, so two logos on one page would fight over them.
  const ids = new Set();
  for (const m of body.matchAll(/id="([^"]+)"/g)) ids.add(m[1]);
  for (const id of ids) {
    const safe = `${key}-${id}`;
    body = body.split(`id="${id}"`).join(`id="${safe}"`);
    body = body.split(`url(#${id})`).join(`url(#${safe})`);
    body = body.split(`"#${id}"`).join(`"#${safe}"`);
  }
  // SVG attributes to JSX props.
  body = body.replace(/([a-z]+)-([a-z])/g, (m, a, b) => {
    if (/^(http|xmlns|xlink)/.test(a)) return m;
    return a + b.toUpperCase();
  });
  body = body.replace(/xlink:href=/g, "xlinkHref=").replace(/xmlns:xlink=/g, "xmlnsXlink=");
  body = body.replace(/<(path|stop|circle|rect|use|ellipse|polygon|line|polyline)([^>]*?)><\/\1>/g, "<$1$2/>");
  return body.trim();
}

const entries = WANT.map(([key, file, label, mono]) => {
  const p = path.join(DIR, file);
  if (!fs.existsSync(p)) throw new Error(`missing ${file}`);
  return { key, label, mono, body: inner(fs.readFileSync(p, "utf8"), key) };
});

const out = `/**
 * The official brand mark for each AI assistant, drawn inline.
 *
 * The marks are generated once from the published brand icon set and committed here, so the dashboard
 * never reaches out to a third party for an asset and never renders a mark drawn from memory. A source
 * with no mark in the set gets a neutral initial tile rather than an invented logo.
 */
import type { ReactNode } from "react";

interface Mark { label: string; mono: boolean; body: ReactNode }

const MARKS: Record<string, Mark> = {
${entries.map((e) => `  ${e.key}: { label: ${JSON.stringify(e.label)}, mono: ${e.mono}, body: (<>${e.body}</>) },`).join("\n")}
};

/** Every slug that has a real mark, for the lookup table to match against. */
export const LOGO_SLUGS = Object.keys(MARKS);

export function AiPlatformLogo({ slug, name, size = 18 }: { slug: string | null; name: string; size?: number }): ReactNode {
  const mark = slug ? MARKS[slug] : undefined;
  if (!mark) {
    // No official mark available. An initial is honest; a hand-drawn approximation would not be.
    return (
      <span aria-hidden className="grid shrink-0 place-items-center rounded-md bg-slate-200 font-700 text-slate-600"
        style={{ width: size, height: size, fontSize: size * 0.55 }}>
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={mark.label}
      className={\`shrink-0 \${mark.mono ? "text-slate-900" : ""}\`}
      {...(mark.mono ? { fill: "currentColor", fillRule: "evenodd" as const } : {})}>
      {mark.body}
    </svg>
  );
}
`;

const dest = path.join(process.cwd(), "src/components/cms/AiPlatformLogo.tsx");
fs.writeFileSync(dest, out, "utf8");
console.log("wrote", dest, out.length, "chars,", entries.length, "marks");
