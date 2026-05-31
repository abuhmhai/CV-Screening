import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MessageGateway } from "../realtime/message.gateway";
import { SendMessageDto } from "./dto/send-message.dto";

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageGateway: MessageGateway
  ) {}

  listConversations(userId: string) {
    return this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { include: { profile: true } } } },
            messages: { take: 20, orderBy: { sentAt: "desc" } }
          }
        }
      },
      orderBy: { lastReadAt: "desc" }
    });
  }

  async sendMessage(userId: string, payload: SendMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        conversationId: payload.conversationId,
        senderId: userId,
        content: payload.content
      }
    });
    await this.messageGateway.emitNewMessage({
      conversationId: message.conversationId,
      messageId: message.id,
      senderId: message.senderId,
      content: message.content,
      sentAt: message.sentAt.toISOString()
    });

    await this.prisma.message.updateMany({
      where: {
        conversationId: payload.conversationId,
        senderId: { not: userId },
        isRead: false
      },
      data: { isRead: false }
    });
    return message;
  }

  async markConversationRead(userId: string, conversationId: string) {
    await this.prisma.$transaction([
      this.prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false
        },
        data: { isRead: true }
      }),
      this.prisma.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId
          }
        },
        data: { lastReadAt: new Date() }
      })
    ]);

    return { ok: true };
  }

  async getUnreadSummary(userId: string) {
    const unreadCount = await this.prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: userId },
        conversation: {
          participants: {
            some: { userId }
          }
        }
      }
    });

    return { unreadCount };
  }
}
