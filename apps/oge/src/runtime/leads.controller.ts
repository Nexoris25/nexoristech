/**
 * Lead intake endpoint (PRD 11). Accepts a scored lead from the website paths and returns a warm
 * acknowledgement. Called server-side by apps/web; the scoring stays internal.
 */
import { Body, Controller, Inject, Post } from "@nestjs/common";
import { LeadsService, type LeadAck } from "./leads.service.js";

@Controller()
export class LeadsController {
  // The token is explicit because injection must not depend on `emitDecoratorMetadata`: esbuild
  // (via tsx) does not emit it, and every dependency would arrive undefined in watch mode.
  constructor(@Inject(LeadsService) private readonly leads: LeadsService) {}

  @Post("leads")
  async record(@Body() body: unknown): Promise<LeadAck> {
    return this.leads.recordLead(body);
  }
}
