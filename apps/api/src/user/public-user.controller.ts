import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { UserService } from "./user.service";

/**
 * Unauthenticated public profile endpoint. Returns a privacy-filtered projection
 * of a candidate's profile, or 404 when the profile is private/missing.
 */
@Controller("public/users")
export class PublicUserController {
  constructor(private readonly userService: UserService) {}

  @Get(":slug")
  async getPublicProfile(@Param("slug") slug: string) {
    const profile = await this.userService.getPublicProfile(slug);
    if (!profile) {
      throw new NotFoundException("Profile not found or is private");
    }
    return profile;
  }
}
