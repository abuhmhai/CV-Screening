import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { CreateReportDto } from "./dto/create-report.dto";
import { ModerationService } from "./moderation.service";

@Controller("moderation")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post("reports")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE)
  reportContent(
    @CurrentUser() user: RequestUser | undefined,
    @Body() payload: CreateReportDto
  ) {
    const currentUser = requireUser(user);
    return this.moderationService.createReport(currentUser.id, payload);
  }

  @Get("reports")
  @Roles(UserRole.ADMIN)
  listReports() {
    return this.moderationService.listReports();
  }
}
