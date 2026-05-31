import { Body, Controller, Get, Patch, Param, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UserService } from "./user.service";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  listUsers() {
    return this.userService.listUsers();
  }

  @Get(":id/profile")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE)
  getProfile(@Param("id") id: string) {
    return this.userService.getProfile(id);
  }

  @Get("me/onboarding-checklist")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE)
  getOnboardingChecklist(@CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.userService.getOnboardingChecklist(currentUser.id);
  }

  @Patch("me/profile")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE)
  updateMyProfile(
    @CurrentUser() user: RequestUser | undefined,
    @Body() payload: UpdateProfileDto
  ) {
    const currentUser = requireUser(user);
    return this.userService.updateProfile(currentUser.id, payload);
  }
}
