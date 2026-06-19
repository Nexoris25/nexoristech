/**
 * Lead intake endpoint (PRD 11). Accepts a scored lead from the website paths and returns a warm
 * acknowledgement. Called server-side by apps/web; the scoring stays internal.
 */
import { Body, Controller, Post } from "@nestjs/common";
// NestJS reads the constructor parameter type from emitted metadata, so LeadsService must be a
// value import, not a type-only one.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { LeadsService, type LeadAck } from "./leads.service.js";

@Controller()
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Post("leads")
  async record(@Body() body: unknown): Promise<LeadAck> {
    return this.leads.recordLead(body);
  }
}
