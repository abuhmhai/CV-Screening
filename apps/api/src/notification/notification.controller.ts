import { Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { NotificationService } from "./notification.service";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  listMine(@CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.notificationService.listForUser(currentUser.id);
  }

  @Patch(":id/read")
  markRead(@Param("id") id: string, @CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.notificationService.markRead(id, currentUser.id);
  }

  @Patch("read-all")
  markAllRead(@CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.notificationService.markAllRead(currentUser.id);
  }
}
