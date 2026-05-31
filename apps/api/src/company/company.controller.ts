import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { Roles } from "../common/auth/roles.decorator";
import { RolesGuard } from "../common/auth/roles.guard";
import { CompanyService } from "./company.service";
import { CreateCompanyDto } from "./dto/create-company.dto";

@Controller("companies")
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER, UserRole.CANDIDATE)
  list() {
    return this.companyService.list();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  create(@Body() payload: CreateCompanyDto) {
    return this.companyService.create(payload);
  }

  @Get(":id/analytics")
  @Roles(UserRole.ADMIN, UserRole.RECRUITER)
  analytics(@Param("id") id: string) {
    return this.companyService.analytics(id);
  }
}
