import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JobStatus, UserRole } from "@prisma/client";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { CreateJobDto } from "./dto/create-job.dto";
import { SearchJobsDto } from "./dto/search-jobs.dto";
import { JobService } from "./job.service";

@Controller("jobs")
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Get()
  list(@Query("status") status?: JobStatus, @Query("location") location?: string) {
    return this.jobService.list(status, location);
  }

  @Get("search")
  search(@Query() query: SearchJobsDto) {
    return this.jobService.search(query);
  }

  @Get("facets")
  facets() {
    return this.jobService.facets();
  }

  @Get(":id")
  getOne(@Param("id") id: string) {
    return this.jobService.getOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  create(@Body() payload: CreateJobDto, @CurrentUser() user?: RequestUser) {
    const currentUser = requireUser(user);
    return this.jobService.create(payload, currentUser.id);
  }
}
