/**
 * Renders CMS markdown bodies (Insights, jobs, legal) with the site's typography. Used in server
 * components; no client interactivity. Element styling is mapped explicitly so it reads correctly
 * without a typography plugin.
 */
import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { resolveDateTokens } from "../lib/date.js";

const components = {
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mt-8 font-syne text-section font-700 text-ink-950">
      {children}
    </h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-6 font-syne text-subhead font-600 text-ink-950">
      {children}
    </h3>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mt-4 text-body text-neutral-700">{children}</p>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mt-4 list-disc pl-6 text-body text-neutral-700">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mt-4 list-decimal pl-6 text-body text-neutral-700">
      {children}
    </ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="mt-1">{children}</li>
  ),
  a: ({ href, children }: { href?: string; children?: ReactNode }) => (
    <a
      href={href}
      className="cursor-pointer text-purple-700 underline hover:text-purple-600"
    >
      {children}
    </a>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-600 text-ink-950">{children}</strong>
  ),
};

export function Markdown({ children }: { children: string }): ReactNode {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {resolveDateTokens(children)}
    </ReactMarkdown>
  );
}
