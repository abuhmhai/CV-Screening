import { Body, Controller, Delete, Get, Param, Patch, Post, Res, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Response } from "express";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { ApplicationService } from "./application.service";
import { CreateApplicationDto } from "./dto/create-application.dto";
import { RespondOfferDto } from "./dto/respond-offer.dto";
import { ScheduleInterviewDto } from "./dto/schedule-interview.dto";
import { SendOfferDto } from "./dto/send-offer.dto";
import { UpdateApplicationStatusDto } from "./dto/update-application-status.dto";

@Controller("applications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @Roles(UserRole.CANDIDATE)
  create(@CurrentUser() user: RequestUser | undefined, @Body() payload: CreateApplicationDto) {
    const currentUser = requireUser(user);
    return this.applicationService.create(currentUser.id, payload);
  }

  @Get("me")
  @Roles(UserRole.CANDIDATE)
  listMine(@CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.applicationService.listForCandidate(currentUser.id);
  }

  @Get(":id")
  @Roles(UserRole.RECRUITER, UserRole.ADMIN, UserRole.CANDIDATE)
  getOne(@Param("id") id: string, @CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.applicationService.getOne(id, currentUser);
  }

  @Delete(":id")
  @Roles(UserRole.CANDIDATE)
  withdraw(@Param("id") id: string, @CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.applicationService.withdraw(id, currentUser.id);
  }

  @Get("job/:jobId")
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  listByJob(@Param("jobId") jobId: string, @CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.applicationService.listByJobForRecruiter(jobId, currentUser.id, currentUser.role);
  }

  @Get("job/:jobId/export")
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  async exportByJob(
    @Param("jobId") jobId: string,
    @CurrentUser() user: RequestUser | undefined,
    @Res() res: Response
  ) {
    const currentUser = requireUser(user);
    const csv = await this.applicationService.exportJobApplicationsCsv(
      jobId,
      currentUser.id,
      currentUser.role
    );
    const fileName = `applications-${jobId}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(csv);
  }

  @Patch(":id/status")
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  updateStatus(
    @Param("id") id: string,
    @Body() payload: UpdateApplicationStatusDto,
    @CurrentUser() user: RequestUser | undefined
  ) {
    const currentUser = requireUser(user);
    return this.applicationService.updateStatus(
      id,
      payload.status,
      currentUser.id,
      currentUser.role,
      payload.note
    );
  }

  @Post(":id/rescreen")
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  rescreen(@Param("id") id: string, @CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.applicationService.rescreenApplication(id, currentUser.id, currentUser.role);
  }

  @Post(":id/schedule-interview")
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  scheduleInterview(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser | undefined,
    @Body() payload: ScheduleInterviewDto
  ) {
    const currentUser = requireUser(user);
    return this.applicationService.scheduleInterview(
      id,
      payload.interviewAt,
      currentUser.id,
      currentUser.role,
      payload.note
    );
  }

  @Post(":id/offer")
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  sendOffer(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser | undefined,
    @Body() payload: SendOfferDto
  ) {
    const currentUser = requireUser(user);
    return this.applicationService.sendOffer(id, payload, currentUser.id, currentUser.role);
  }

  @Post(":id/offer/respond")
  @Roles(UserRole.CANDIDATE)
  respondToOffer(
    @Param("id") id: string,
    @CurrentUser() user: RequestUser | undefined,
    @Body() payload: RespondOfferDto
  ) {
    const currentUser = requireUser(user);
    return this.applicationService.respondToOffer(id, currentUser.id, payload);
  }
}
