/** The Oge gateway module: the website-bot service plus the health and chat endpoints. */
import { Module } from "@nestjs/common";
import { OgeService } from "./oge.service.js";
import { HealthController } from "./health.controller.js";
import { ChatController } from "./chat.controller.js";

@Module({
  controllers: [HealthController, ChatController],
  providers: [OgeService],
})
export class AppModule {}
