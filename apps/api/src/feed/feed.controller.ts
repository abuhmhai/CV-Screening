import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { OptionalJwtAuthGuard } from "../common/auth/optional-jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { FeedService } from "./feed.service";

@Controller("feed")
@UseGuards(OptionalJwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  loadFeed(
    @CurrentUser() user: RequestUser | undefined,
    @Query("cursor") cursor?: string,
    @Query("limit") limitRaw?: string,
    @Query("authorId") authorId?: string
  ) {
    const limit = Number(limitRaw ?? "20");
    return this.feedService.loadFeed(user?.id, cursor, Number.isNaN(limit) ? 20 : limit, authorId);
  }
}
