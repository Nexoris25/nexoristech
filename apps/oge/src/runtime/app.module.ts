/** The Oge gateway module: the website-bot service, the Solution Finder, and the endpoints. */
import { Module } from "@nestjs/common";
import { OgeService } from "./oge.service.js";
import { FinderService } from "./finder.service.js";
import { HealthController } from "./health.controller.js";
import { ChatController } from "./chat.controller.js";
import { FinderController } from "./finder.controller.js";

@Module({
  controllers: [HealthController, ChatController, FinderController],
  providers: [OgeService, FinderService],
})
export class AppModule {}
