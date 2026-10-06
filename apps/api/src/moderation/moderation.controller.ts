import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { CreateReportDto, ResolveReportDto } from "./dto/create-report.dto";
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

  @Patch("reports/:id")
  @Roles(UserRole.ADMIN)
  resolveReport(@Param("id") id: string, @Body() payload: ResolveReportDto) {
    return this.moderationService.resolveReport(id, payload.action);
  }

  @Get("recovery-requests")
  @Roles(UserRole.ADMIN)
  listRecoveryRequests() { return this.moderationService.listRecoveryRequests(); }

  @Patch("recovery-requests/:id")
  @Roles(UserRole.ADMIN)
  resolveRecoveryRequest(@Param("id") id: string) { return this.moderationService.resolveRecoveryRequest(id); }
}
