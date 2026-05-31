import { Module } from "@nestjs/common";
import { AiScreeningModule } from "../ai-screening/ai-screening.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { ApplicationController } from "./application.controller";
import { ApplicationService } from "./application.service";

@Module({
  imports: [RealtimeModule, AiScreeningModule],
  controllers: [ApplicationController],
  providers: [ApplicationService],
})
export class ApplicationModule {}
