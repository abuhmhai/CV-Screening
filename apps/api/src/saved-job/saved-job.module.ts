import { Module } from "@nestjs/common";
import { SavedJobController } from "./saved-job.controller";
import { SavedJobService } from "./saved-job.service";

@Module({
  controllers: [SavedJobController],
  providers: [SavedJobService]
})
export class SavedJobModule {}
