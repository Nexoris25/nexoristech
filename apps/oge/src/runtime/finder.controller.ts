/**
 * The Solution Finder endpoint (PRD 10.5). Takes the five answers and returns the deterministic
 * recommendation (one to three real service pages plus the industry page) and a short rationale.
 * Called server-side by apps/web; not streamed.
 */
import { Body, Controller, Inject, Post } from "@nestjs/common";
import { FinderService, type FinderResult } from "./finder.service.js";

@Controller()
export class FinderController {
  // The token is explicit because injection must not depend on `emitDecoratorMetadata`: esbuild
  // (via tsx) does not emit it, and every dependency would arrive undefined in watch mode.
  constructor(@Inject(FinderService) private readonly finder: FinderService) {}

  @Post("finder")
  async recommend(@Body() body: unknown): Promise<FinderResult> {
    return this.finder.recommend(body);
  }
}
