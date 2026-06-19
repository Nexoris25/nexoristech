/**
 * Shared database and answer shapes for the Oge gateway. The DbClient interface is the minimal
 * query surface the retrieval and cache layers need; a node-postgres Client or Pool satisfies it
 * structurally, so those layers stay decoupled from the connection lifecycle (which the NestJS
 * runtime owns).
 */

/** The minimal database surface used by retrieval and the caches. */
export interface DbClient {
  query<R extends Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: R[] }>;
}

/** A cited source: the page an answer or chunk came from. */
export interface Source {
  readonly url: string;
  readonly title: string;
}

/** A grounded answer with the pages it was drawn from. */
export interface GroundedAnswer {
  readonly answer: string;
  readonly sources: Source[];
}
