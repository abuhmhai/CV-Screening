import { Module } from "@nestjs/common";
import { GeneratedCvController } from "./generated-cv.controller";
import { GeneratedCvService } from "./generated-cv.service";

@Module({
  controllers: [GeneratedCvController],
  providers: [GeneratedCvService]
})
export class GeneratedCvModule {}
