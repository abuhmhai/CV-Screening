import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { RecommendationService } from "./recommendation.service";

@Controller("recommendations")
@UseGuards(JwtAuthGuard)
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get("jobs")
  recommendJobs(@CurrentUser() user: RequestUser | undefined, @Query("limit") limitRaw?: string) {
    const currentUser = requireUser(user);
    const limit = Number(limitRaw ?? "10");
    return this.recommendationService.recommendJobs(currentUser.id, Number.isNaN(limit) ? 10 : limit);
  }

  @Get("people")
  recommendPeople(
    @CurrentUser() user: RequestUser | undefined,
    @Query("limit") limitRaw?: string
  ) {
    const currentUser = requireUser(user);
    const limit = Number(limitRaw ?? "10");
    return this.recommendationService.recommendPeople(
      currentUser.id,
      Number.isNaN(limit) ? 10 : limit
    );
  }
}
