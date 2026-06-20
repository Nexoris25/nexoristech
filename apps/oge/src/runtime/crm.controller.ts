/**
 * The CRM Worker assist endpoint (PRD 3.2). Called server-to-server by the admin dashboard,
 * authenticated by the internal shared secret. Not a public endpoint.
 */
import {
  Body,
  Controller,
  Headers,
  Post,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
// NestJS reads the constructor parameter type from emitted metadata, so CrmService must be a
// value import, not a type-only one.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { CrmService, type DraftInput, type DraftResult } from "./crm.service.js";

@Controller()
export class CrmController {
  constructor(private readonly crm: CrmService) {}

  @Post("crm/draft")
  async draft(
    @Body() body: Partial<DraftInput>,
    @Headers("x-internal-secret") secret: string | undefined,
  ): Promise<DraftResult> {
    const expected = process.env.OGE_REINGEST_SHARED_SECRET;
    if (!expected || secret !== expected) {
      throw new UnauthorizedException();
    }
    if (typeof body.message !== "string" || body.message.trim().length === 0) {
      throw new BadRequestException("A lead message is required.");
    }
    return this.crm.draftReply(body as DraftInput);
  }
}
