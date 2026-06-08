import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { SendMessageDto } from "./dto/send-message.dto";
import { MessageService } from "./message.service";

@Controller("messages")
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get("conversations")
  listConversations(@CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.messageService.listConversations(currentUser.id);
  }

  @Get("conversations/:conversationId")
  listConversationMessages(
    @CurrentUser() user: RequestUser | undefined,
    @Param("conversationId") conversationId: string
  ) {
    const currentUser = requireUser(user);
    return this.messageService.listConversationMessages(currentUser.id, conversationId);
  }

  @Post()
  sendMessage(@CurrentUser() user: RequestUser | undefined, @Body() payload: SendMessageDto) {
    const currentUser = requireUser(user);
    return this.messageService.sendMessage(currentUser.id, payload);
  }

  @Patch("conversations/:conversationId/read")
  markConversationRead(
    @CurrentUser() user: RequestUser | undefined,
    @Param("conversationId") conversationId: string
  ) {
    const currentUser = requireUser(user);
    return this.messageService.markConversationRead(currentUser.id, conversationId);
  }

  @Get("unread-summary")
  getUnreadSummary(@CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.messageService.getUnreadSummary(currentUser.id);
  }
}
