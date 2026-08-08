/**
 * The re-ingestion endpoint (PRD 10.3). The CMS calls it on publish, update, and delete,
 * authenticated by a shared secret. It is not a public endpoint.
 */
import {
  Body,
  Controller,
  Headers,
  Inject,
  Post,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { IngestService, type ReingestRequest } from "./ingest.service.js";

@Controller()
export class IngestController {
  // The token is explicit because injection must not depend on `emitDecoratorMetadata`: esbuild
  // (via tsx) does not emit it, and every dependency would arrive undefined in watch mode.
  constructor(@Inject(IngestService) private readonly ingest: IngestService) {}

  @Post("reingest")
  async reingest(
    @Body() body: Record<string, unknown>,
    @Headers("x-reingest-secret") secret: string | undefined,
  ): Promise<{ status: string; chunks: number }> {
    const expected = process.env.OGE_REINGEST_SHARED_SECRET;
    if (!expected || secret !== expected) {
      throw new UnauthorizedException();
    }

    if (typeof body.url !== "string" || body.url.length === 0) {
      throw new BadRequestException("A url is required.");
    }
    if (body.action === "delete") {
      return this.ingest.handle({ action: "delete", url: body.url });
    }
    if (body.action === "upsert") {
      if (
        typeof body.title !== "string" ||
        typeof body.text !== "string" ||
        typeof body.sourceType !== "string"
      ) {
        throw new BadRequestException(
          "An upsert needs title, text, and sourceType.",
        );
      }
      return this.ingest.handle(body as unknown as ReingestRequest);
    }
    throw new BadRequestException("action must be upsert or delete.");
  }
}
