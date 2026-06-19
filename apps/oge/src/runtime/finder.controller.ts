/**
 * The Solution Finder endpoint (PRD 10.5). Takes the five answers and returns the deterministic
 * recommendation (one to three real service pages plus the industry page) and a short rationale.
 * Called server-side by apps/web; not streamed.
 */
import { Body, Controller, Post } from "@nestjs/common";
// NestJS reads the constructor parameter type from emitted metadata, so FinderService must be a
// value import, not a type-only one.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { FinderService, type FinderResult } from "./finder.service.js";

@Controller()
export class FinderController {
  constructor(private readonly finder: FinderService) {}

  @Post("finder")
  async recommend(@Body() body: unknown): Promise<FinderResult> {
    return this.finder.recommend(body);
  }
}
