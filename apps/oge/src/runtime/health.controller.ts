/** Health endpoint: reports whether the gateway can reach its database. */
import { Controller, Get, Inject } from "@nestjs/common";
import { OgeService } from "./oge.service.js";

@Controller()
export class HealthController {
  // The token is explicit because injection must not depend on `emitDecoratorMetadata`: esbuild
  // (via tsx) does not emit it, and every dependency would arrive undefined in watch mode.
  constructor(@Inject(OgeService) private readonly oge: OgeService) {}

  @Get("health")
  async health(): Promise<{ status: string; db: boolean }> {
    return this.oge.health();
  }
}
