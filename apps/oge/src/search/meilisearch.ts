/**
 * A small Meilisearch REST client for the keyword half of hybrid retrieval (PRD 10.4) and site
 * search (Stage 8). No SDK: just fetch against the v1 HTTP API, with task polling so scripts can
 * wait for an index or a document batch to finish. apps/oge uses the admin API key for indexing;
 * the browser uses the search-only key. Configuration comes from the gitignored .env.
 */
import {
  ProviderUnavailableError,
  RateLimitError,
  ProviderError,
} from "../providers/errors.js";

export interface MeiliConfig {
  readonly host: string;
  readonly apiKey: string;
}

/** Read the Meilisearch host and admin key from the environment, or null when not configured. */
export function meiliConfigFromEnv(
  env: Readonly<Record<string, string | undefined>>,
): MeiliConfig | null {
  const host = env.MEILISEARCH_HOST;
  const apiKey = env.MEILISEARCH_API_KEY;
  if (!host || !apiKey) return null;
  return { host: host.replace(/\/+$/, ""), apiKey };
}

interface MeiliTask {
  taskUid?: number;
  status?: string;
  error?: { message?: string } | null;
}

export interface MeiliHit {
  readonly docId: string;
  readonly chunkId: string;
  readonly url: string;
  readonly title: string;
  readonly content: string;
}

export class MeiliClient {
  constructor(private readonly config: MeiliConfig) {}

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const source = `meilisearch:${path}`;
    let response: Response;
    try {
      response = await fetch(`${this.config.host}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          ...(body === undefined
            ? {}
            : { "Content-Type": "application/json" }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch (cause) {
      throw new ProviderUnavailableError(`${source} request failed`, source, {
        cause,
      });
    }
    if (response.status === 429) {
      throw new RateLimitError(`${source} rate limited`, source);
    }
    if (response.status >= 500) {
      throw new ProviderUnavailableError(
        `${source} returned ${response.status}`,
        source,
      );
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new ProviderError(
        `${source} returned ${response.status}: ${detail.slice(0, 300)}`,
        source,
      );
    }
    return (await response.json()) as T;
  }

  async health(): Promise<boolean> {
    const res = await this.request<{ status?: string }>("GET", "/health");
    return res.status === "available";
  }

  /** Create the index if it does not exist, with the given primary key. */
  async ensureIndex(uid: string, primaryKey: string): Promise<void> {
    const task = await this.request<MeiliTask>("POST", "/indexes", {
      uid,
      primaryKey,
    });
    // A 201 with a task means it is being created; an already-existing index is fine too.
    if (task.taskUid !== undefined) await this.waitForTask(task.taskUid);
  }

  async updateSettings(uid: string, settings: unknown): Promise<void> {
    const task = await this.request<MeiliTask>(
      "PATCH",
      `/indexes/${uid}/settings`,
      settings,
    );
    if (task.taskUid !== undefined) await this.waitForTask(task.taskUid);
  }

  async addDocuments(uid: string, documents: unknown[]): Promise<void> {
    const task = await this.request<MeiliTask>(
      "POST",
      `/indexes/${uid}/documents`,
      documents,
    );
    if (task.taskUid !== undefined) await this.waitForTask(task.taskUid);
  }

  async deleteByFilter(uid: string, filter: string): Promise<void> {
    const task = await this.request<MeiliTask>(
      "POST",
      `/indexes/${uid}/documents/delete`,
      { filter },
    );
    if (task.taskUid !== undefined) await this.waitForTask(task.taskUid);
  }

  async search(
    uid: string,
    query: string,
    options: { limit?: number; filter?: string } = {},
  ): Promise<MeiliHit[]> {
    const res = await this.request<{ hits?: MeiliHit[] }>(
      "POST",
      `/indexes/${uid}/search`,
      { q: query, limit: options.limit ?? 10, ...(options.filter ? { filter: options.filter } : {}) },
    );
    return res.hits ?? [];
  }

  /** Poll a task until it succeeds, throwing on failure or timeout. */
  async waitForTask(taskUid: number, timeoutMs = 30_000): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const task = await this.request<MeiliTask>("GET", `/tasks/${taskUid}`);
      if (task.status === "succeeded") return;
      if (task.status === "failed" || task.status === "canceled") {
        throw new ProviderError(
          `Meilisearch task ${taskUid} ${task.status}: ${task.error?.message ?? ""}`,
          "meilisearch:task",
        );
      }
      if (Date.now() > deadline) {
        throw new ProviderUnavailableError(
          `Meilisearch task ${taskUid} did not finish within ${timeoutMs}ms`,
          "meilisearch:task",
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
}

/** The knowledge-base index name and primary key, shared by indexing and retrieval. */
export const KB_INDEX = "kb_chunk" as const;
export const KB_PRIMARY_KEY = "docId" as const;

/** Meilisearch document ids allow only [a-zA-Z0-9-_]; derive one from a chunk id. */
export function toDocId(chunkId: string): string {
  return chunkId.replace(/[^a-zA-Z0-9-_]/g, "_");
}
