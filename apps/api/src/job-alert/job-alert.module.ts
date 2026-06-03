import { Module } from "@nestjs/common";
import { JobAlertController } from "./job-alert.controller";
import { JobAlertService } from "./job-alert.service";

@Module({
  controllers: [JobAlertController],
  providers: [JobAlertService]
})
export class JobAlertModule {}
