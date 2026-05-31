import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { FeedService } from "./feed.service";

@Controller("feed")
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  loadFeed(
    @CurrentUser() user: RequestUser | undefined,
    @Query("cursor") cursor?: string,
    @Query("limit") limitRaw?: string
  ) {
    const limit = Number(limitRaw ?? "20");
    const currentUser = requireUser(user);
    return this.feedService.loadFeed(currentUser.id, cursor, Number.isNaN(limit) ? 20 : limit);
  }
}
