/**
 * Bootstrap the Oge AI gateway (NestJS). This is the only process that holds the AI provider keys
 * and talks to nexoris_oge; the browser reaches it through the chat endpoint. CORS is enabled so
 * apps/web can call it. In local development it loads the gitignored repo-root .env; in production
 * the environment is set directly.
 */
import "reflect-metadata";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./runtime/app.module.js";

function loadLocalEnv(): void {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    // dist/main.js -> repo root is three levels up; src/main.ts (tsx) is the same.
    process.loadEnvFile(join(here, "..", "..", "..", ".env"));
  } catch {
    // No .env on disk; rely on the real environment.
  }
}

async function bootstrap(): Promise<void> {
  loadLocalEnv();
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = Number(process.env.OGE_PORT ?? 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Oge gateway listening on http://localhost:${port}`);
}

void bootstrap();
