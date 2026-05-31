import { Body, Controller, Get, Patch, Param, UseGuards, Post, UseInterceptors, UploadedFile, BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
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

  @Post("me/cv")
  @Roles(UserRole.CANDIDATE)
  @UseInterceptors(FileInterceptor("file"))
  async uploadCv(
    @CurrentUser() user: RequestUser | undefined,
    @UploadedFile() file: Express.Multer.File
  ) {
    const currentUser = requireUser(user);
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    // Simple validation
    if (file.mimetype !== "application/pdf" && !file.mimetype.includes("wordprocessingml")) {
      throw new BadRequestException("Only PDF or DOCX files are allowed");
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException("File size exceeds 5MB limit");
    }

    return this.userService.uploadCv(currentUser.id, file);
  }
}
