/**
 * The re-ingestion endpoint (PRD 10.3). The CMS calls it on publish, update, and delete,
 * authenticated by a shared secret. It is not a public endpoint.
 */
import {
  Body,
  Controller,
  Headers,
  Post,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
// NestJS reads the constructor parameter type from emitted metadata, so IngestService must be a
// value import, not a type-only one.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { IngestService, type ReingestRequest } from "./ingest.service.js";

@Controller()
export class IngestController {
  constructor(private readonly ingest: IngestService) {}

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
