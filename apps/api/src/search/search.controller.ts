import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { SearchService } from "./search.service";

@Controller("search")
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query("query") query = "",
    @Query("type") type = "all",
    @Query("limit") limitRaw?: string
  ) {
    const limit = Number(limitRaw ?? "10");
    return this.searchService.unifiedSearch(query, type, Number.isNaN(limit) ? 10 : limit);
  }
}
