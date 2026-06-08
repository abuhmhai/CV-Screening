import { ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { MessageGateway } from "../realtime/message.gateway";
import { SendMessageDto } from "./dto/send-message.dto";

@Injectable()
export class MessageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messageGateway: MessageGateway
  ) {}

  async listConversations(userId: string) {
    const rows = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { include: { profile: true } } } },
            messages: { take: 1, orderBy: { sentAt: "desc" } }
          }
        }
      }
    });

    return rows.sort((a, b) => {
      const aAt = a.conversation.messages[0]?.sentAt?.getTime() ?? 0;
      const bAt = b.conversation.messages[0]?.sentAt?.getTime() ?? 0;
      return bAt - aAt;
    });
  }

  async sendMessage(userId: string, payload: SendMessageDto) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: payload.conversationId,
          userId
        }
      }
    });
    if (!participant) {
      throw new ForbiddenException("You are not a participant in this conversation");
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: payload.conversationId,
        senderId: userId,
        content: payload.content.trim()
      }
    });
    await this.messageGateway.emitNewMessage({
      conversationId: message.conversationId,
      messageId: message.id,
      senderId: message.senderId,
      content: message.content,
      sentAt: message.sentAt.toISOString(),
      isRead: message.isRead
    });

    return message;
  }

  async listConversationMessages(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });
    if (!participant) {
      throw new ForbiddenException("You are not a participant in this conversation");
    }

    return this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { sentAt: "asc" },
      take: 100
    });
  }

  async markConversationRead(userId: string, conversationId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId
        }
      }
    });
    if (!participant) {
      throw new ForbiddenException("You are not a participant in this conversation");
    }

    const unread = await this.prisma.message.findMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
        deletedAt: null
      },
      select: { id: true }
    });

    const readAt = new Date();

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
        data: { lastReadAt: readAt }
      })
    ]);

    const messageIds = unread.map((row) => row.id);
    if (messageIds.length > 0) {
      await this.messageGateway.emitMessagesRead({
        conversationId,
        messageIds,
        readBy: userId,
        readAt: readAt.toISOString()
      });
    }

    return { ok: true, messageIds };
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
