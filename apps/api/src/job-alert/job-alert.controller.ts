import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { CreateJobAlertDto, UpdateJobAlertDto } from "./dto/job-alert.dto";
import { JobAlertService } from "./job-alert.service";

@Controller("job-alerts")
@UseGuards(JwtAuthGuard)
export class JobAlertController {
  constructor(private readonly jobAlertService: JobAlertService) {}

  @Get()
  list(@CurrentUser() user: RequestUser | undefined) {
    return this.jobAlertService.list(requireUser(user).id);
  }

  @Post()
  create(@Body() dto: CreateJobAlertDto, @CurrentUser() user: RequestUser | undefined) {
    return this.jobAlertService.create(requireUser(user).id, dto);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateJobAlertDto,
    @CurrentUser() user: RequestUser | undefined
  ) {
    return this.jobAlertService.update(requireUser(user).id, id, dto);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @CurrentUser() user: RequestUser | undefined) {
    return this.jobAlertService.remove(requireUser(user).id, id);
  }
}
