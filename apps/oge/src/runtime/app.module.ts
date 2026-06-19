/** The Oge gateway module: the website-bot service, the Solution Finder, lead intake, and endpoints. */
import { Module } from "@nestjs/common";
import { OgeService } from "./oge.service.js";
import { FinderService } from "./finder.service.js";
import { LeadsService } from "./leads.service.js";
import { IngestService } from "./ingest.service.js";
import { HealthController } from "./health.controller.js";
import { ChatController } from "./chat.controller.js";
import { FinderController } from "./finder.controller.js";
import { LeadsController } from "./leads.controller.js";
import { IngestController } from "./ingest.controller.js";

@Module({
  controllers: [
    HealthController,
    ChatController,
    FinderController,
    LeadsController,
    IngestController,
  ],
  providers: [OgeService, FinderService, LeadsService, IngestService],
})
export class AppModule {}
