import { Body, Controller, Delete, Get, Patch, Param, UseGuards, Post, UseInterceptors, UploadedFile, BadRequestException } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { CreateExperienceDto, UpdateExperienceDto } from "./dto/experience.dto";
import { CreateEducationDto, UpdateEducationDto } from "./dto/education.dto";
import { UpsertSkillDto } from "./dto/skill.dto";
import { UserService } from "./user.service";

const PROFILE_ROLES = [UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE] as const;

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

  @Post("me/avatar")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE)
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @CurrentUser() user: RequestUser | undefined,
    @UploadedFile() file: Express.Multer.File
  ) {
    const currentUser = requireUser(user);
    if (!file) {
      throw new BadRequestException("No file uploaded");
    }
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.mimetype)) {
      throw new BadRequestException("Only PNG, JPEG or WEBP images are allowed");
    }
    if (file.size > 3 * 1024 * 1024) {
      throw new BadRequestException("Image size exceeds 3MB limit");
    }

    return this.userService.uploadAvatar(currentUser.id, file);
  }

  // --- Work experience ---
  @Get("me/experiences")
  @Roles(...PROFILE_ROLES)
  listExperiences(@CurrentUser() user: RequestUser | undefined) {
    return this.userService.listExperiences(requireUser(user).id);
  }

  @Post("me/experiences")
  @Roles(...PROFILE_ROLES)
  createExperience(@CurrentUser() user: RequestUser | undefined, @Body() dto: CreateExperienceDto) {
    return this.userService.createExperience(requireUser(user).id, dto);
  }

  @Patch("me/experiences/:id")
  @Roles(...PROFILE_ROLES)
  updateExperience(
    @CurrentUser() user: RequestUser | undefined,
    @Param("id") id: string,
    @Body() dto: UpdateExperienceDto
  ) {
    return this.userService.updateExperience(requireUser(user).id, id, dto);
  }

  @Delete("me/experiences/:id")
  @Roles(...PROFILE_ROLES)
  deleteExperience(@CurrentUser() user: RequestUser | undefined, @Param("id") id: string) {
    return this.userService.deleteExperience(requireUser(user).id, id);
  }

  // --- Education ---
  @Get("me/educations")
  @Roles(...PROFILE_ROLES)
  listEducations(@CurrentUser() user: RequestUser | undefined) {
    return this.userService.listEducations(requireUser(user).id);
  }

  @Post("me/educations")
  @Roles(...PROFILE_ROLES)
  createEducation(@CurrentUser() user: RequestUser | undefined, @Body() dto: CreateEducationDto) {
    return this.userService.createEducation(requireUser(user).id, dto);
  }

  @Patch("me/educations/:id")
  @Roles(...PROFILE_ROLES)
  updateEducation(
    @CurrentUser() user: RequestUser | undefined,
    @Param("id") id: string,
    @Body() dto: UpdateEducationDto
  ) {
    return this.userService.updateEducation(requireUser(user).id, id, dto);
  }

  @Delete("me/educations/:id")
  @Roles(...PROFILE_ROLES)
  deleteEducation(@CurrentUser() user: RequestUser | undefined, @Param("id") id: string) {
    return this.userService.deleteEducation(requireUser(user).id, id);
  }

  // --- Skills ---
  @Get("me/skills")
  @Roles(...PROFILE_ROLES)
  listSkills(@CurrentUser() user: RequestUser | undefined) {
    return this.userService.listSkills(requireUser(user).id);
  }

  @Post("me/skills")
  @Roles(...PROFILE_ROLES)
  upsertSkill(@CurrentUser() user: RequestUser | undefined, @Body() dto: UpsertSkillDto) {
    return this.userService.upsertSkill(requireUser(user).id, dto);
  }

  @Delete("me/skills/:skillId")
  @Roles(...PROFILE_ROLES)
  deleteSkill(@CurrentUser() user: RequestUser | undefined, @Param("skillId") skillId: string) {
    return this.userService.deleteSkill(requireUser(user).id, skillId);
  }
}
