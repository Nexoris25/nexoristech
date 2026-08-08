/**
 * CMS editorial + vision endpoints for the admin dashboard (PRD Part Two). Called server-to-server by
 * the admin, authenticated by the internal shared secret. Not public. On success returns the draft; on
 * any AI failure it throws, and the admin falls back to a deterministic draft so the editor always has
 * something to approve.
 */
import { BadRequestException, Body, Controller, Headers, Inject, Post, UnauthorizedException } from "@nestjs/common";
import { ContentService, type EditorialInput, type EditorialResult, type EditorialKind } from "./content.service.js";

const KINDS: readonly EditorialKind[] = ["seo", "tldr", "excerpt", "faqs", "author-bio", "internal-links"];

@Controller()
export class ContentController {
  // The token is explicit because injection must not depend on `emitDecoratorMetadata`: esbuild
  // (via tsx) does not emit it, and every dependency would arrive undefined in watch mode.
  constructor(@Inject(ContentService) private readonly content: ContentService) {}

  private auth(secret: string | undefined): void {
    const expected = process.env.OGE_REINGEST_SHARED_SECRET;
    if (!expected || secret !== expected) throw new UnauthorizedException();
  }

  @Post("content/generate")
  async generate(
    @Body() body: Partial<EditorialInput>,
    @Headers("x-internal-secret") secret: string | undefined,
  ): Promise<{ kind: EditorialKind; result: EditorialResult }> {
    this.auth(secret);
    if (!body.kind || !KINDS.includes(body.kind)) throw new BadRequestException("A valid kind is required.");
    const result = await this.content.generate(body as EditorialInput);
    return { kind: body.kind, result };
  }

  @Post("content/alt-text")
  async altText(
    @Body() body: { data?: string; mimeType?: string },
    @Headers("x-internal-secret") secret: string | undefined,
  ): Promise<{ altText: string }> {
    this.auth(secret);
    if (!body.data || !body.mimeType) throw new BadRequestException("Image data and mimeType are required.");
    return { altText: await this.content.altText(body.data, body.mimeType) };
  }
}
