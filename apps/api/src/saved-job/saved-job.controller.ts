import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { SavedJobService } from "./saved-job.service";

@Controller()
@UseGuards(JwtAuthGuard)
export class SavedJobController {
  constructor(private readonly savedJobService: SavedJobService) {}

  @Post("jobs/:id/save")
  save(@Param("id") jobId: string, @CurrentUser() user: RequestUser | undefined) {
    return this.savedJobService.save(requireUser(user).id, jobId);
  }

  @Delete("jobs/:id/save")
  unsave(@Param("id") jobId: string, @CurrentUser() user: RequestUser | undefined) {
    return this.savedJobService.unsave(requireUser(user).id, jobId);
  }

  @Get("users/me/saved-jobs")
  listSaved(@CurrentUser() user: RequestUser | undefined) {
    return this.savedJobService.listForUser(requireUser(user).id);
  }

  @Get("users/me/saved-jobs/ids")
  savedIds(@CurrentUser() user: RequestUser | undefined) {
    return this.savedJobService.savedIds(requireUser(user).id);
  }
}
