/** Health endpoint: reports whether the gateway can reach its database. */
import { Controller, Get } from "@nestjs/common";
// NestJS reads the constructor parameter type from emitted metadata, so OgeService must be a
// value import, not a type-only one.
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { OgeService } from "./oge.service.js";

@Controller()
export class HealthController {
  constructor(private readonly oge: OgeService) {}

  @Get("health")
  async health(): Promise<{ status: string; db: boolean }> {
    return this.oge.health();
  }
}
