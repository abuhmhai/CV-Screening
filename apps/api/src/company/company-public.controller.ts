import { Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { CompanyService } from "./company.service";

@Controller("companies")
export class CompanyPublicController {
  constructor(private readonly companyService: CompanyService) {}

  @Get(":id")
  getPublicDetail(@Param("id") id: string) {
    return this.companyService.getPublicDetail(id);
  }

  @Post(":id/follow")
  @UseGuards(JwtAuthGuard)
  follow(@Param("id") id: string, @CurrentUser() user: RequestUser | undefined) {
    return this.companyService.follow(requireUser(user).id, id);
  }

  @Delete(":id/follow")
  @UseGuards(JwtAuthGuard)
  unfollow(@Param("id") id: string, @CurrentUser() user: RequestUser | undefined) {
    return this.companyService.unfollow(requireUser(user).id, id);
  }

  @Get(":id/following")
  @UseGuards(JwtAuthGuard)
  following(@Param("id") id: string, @CurrentUser() user: RequestUser | undefined) {
    return this.companyService.isFollowing(requireUser(user).id, id);
  }
}
