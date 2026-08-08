/** The Oge gateway module: the website-bot service, the Solution Finder, lead intake, and endpoints. */
import { Module } from "@nestjs/common";
import { OgeService } from "./oge.service.js";
import { FinderService } from "./finder.service.js";
import { LeadsService } from "./leads.service.js";
import { IngestService } from "./ingest.service.js";
import { CrmService } from "./crm.service.js";
import { ContentService } from "./content.service.js";
import { HealthController } from "./health.controller.js";
import { ChatController } from "./chat.controller.js";
import { FinderController } from "./finder.controller.js";
import { LeadsController } from "./leads.controller.js";
import { IngestController } from "./ingest.controller.js";
import { CrmController } from "./crm.controller.js";
import { ContentController } from "./content.controller.js";

@Module({
  controllers: [
    HealthController,
    ChatController,
    FinderController,
    LeadsController,
    IngestController,
    CrmController,
    ContentController,
  ],
  providers: [
    OgeService,
    FinderService,
    LeadsService,
    IngestService,
    CrmService,
    ContentService,
  ],
})
export class AppModule {}
