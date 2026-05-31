import { Module } from "@nestjs/common";
import { AiScreeningService } from "./ai-screening.service";

@Module({
  providers: [AiScreeningService],
  exports: [AiScreeningService],
})
export class AiScreeningModule {}
