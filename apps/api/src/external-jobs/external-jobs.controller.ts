import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../common/auth/optional-jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { ExternalJobsService } from "./external-jobs.service";
import { QueryJobsDto } from "./dto/query-jobs.dto";
import { ScreenCvDto } from "./dto/screen-cv.dto";

@Controller("external-jobs")
export class ExternalJobsController {
  constructor(private readonly externalJobsService: ExternalJobsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @Query() query: QueryJobsDto,
    @CurrentUser() user: RequestUser | undefined
  ) {
    return this.externalJobsService.list(query, user?.id);
  }

  @Get("saved/ids")
  @UseGuards(JwtAuthGuard)
  getSavedIds(@CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.externalJobsService.getSavedIds(currentUser.id);
  }

  @Post(":id/save")
  @UseGuards(JwtAuthGuard)
  toggleSave(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser | undefined
  ) {
    const currentUser = requireUser(user);
    return this.externalJobsService.toggleSave(currentUser.id, id);
  }

  @Delete(":id/save")
  @UseGuards(JwtAuthGuard)
  unsave(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser | undefined
  ) {
    const currentUser = requireUser(user);
    return this.externalJobsService.unsave(currentUser.id, id);
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.externalJobsService.getOne(id);
  }

  @Get(":id/summary")
  summarize(@Param("id") id: string) {
    return this.externalJobsService.summarize(id);
  }

  @Post(":id/screen")
  @UseGuards(JwtAuthGuard)
  screen(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser | undefined,
    @Body() payload: ScreenCvDto
  ) {
    const currentUser = requireUser(user);
    return this.externalJobsService.screen(id, currentUser.id, payload);
  }

  @Post("crawl")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  crawl(@Body("keywords") keywords?: string[]) {
    return this.externalJobsService.triggerCrawl(keywords);
  }

  @Post("sync")
  @UseGuards(OptionalJwtAuthGuard)
  sync(@Body("keywords") keywords?: string[]) {
    return this.externalJobsService.triggerCrawl(keywords);
  }
}
