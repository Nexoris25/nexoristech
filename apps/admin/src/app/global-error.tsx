"use client";
/**
 * The last resort: an error in the root layout itself, where no other boundary is mounted and the
 * document has to be rendered from scratch. Deliberately dependency-free and inline-styled, because
 * whatever failed may be the thing that would have provided the styles.
 */
import type { ReactNode } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): ReactNode {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Inter, system-ui, sans-serif", background: "#fff" }}>
        <div style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: "2rem" }}>
          <div style={{ maxWidth: "28rem", textAlign: "center" }}>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              The admin could not start
            </h1>
            <p style={{ marginTop: "0.75rem", fontSize: "0.9rem", lineHeight: 1.6, color: "#475569" }}>
              Something failed before any screen could be drawn. Trying again may clear it. If it
              does not, this needs whoever runs the server.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "1.5rem", background: "#543CDA", color: "#fff", border: 0,
                borderRadius: "0.5rem", padding: "0.65rem 1.25rem", fontSize: "0.85rem",
                fontWeight: 600, cursor: "pointer",
              }}
            >
              Try again
            </button>
            {error.digest ? (
              <p style={{ marginTop: "1.25rem", fontFamily: "monospace", fontSize: "0.72rem", color: "#94a3b8" }}>
                Reference {error.digest}
              </p>
            ) : null}
          </div>
        </div>
      </body>
    </html>
  );
}
