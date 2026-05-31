import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { UpdatePrivacySettingsDto } from "./dto/update-privacy-settings.dto";
import { PrivacyService } from "./privacy.service";

@Controller("privacy")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get("settings")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE)
  getSettings(@CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.privacyService.getSettings(currentUser.id);
  }

  @Patch("settings")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE)
  updateSettings(
    @CurrentUser() user: RequestUser | undefined,
    @Body() payload: UpdatePrivacySettingsDto
  ) {
    const currentUser = requireUser(user);
    return this.privacyService.updateSettings(currentUser.id, payload);
  }
}
