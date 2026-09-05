/** Compatibility for the singular spelling. The canonical discovery file is /llms.txt. */
export function GET(): Response {
  return new Response(null, { status: 308, headers: { Location: "/llms.txt" } });
}
