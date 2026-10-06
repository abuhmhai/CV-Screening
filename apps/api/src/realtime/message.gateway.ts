import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from "@nestjs/websockets";
import { OnModuleInit } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { RedisPubSubService } from "./redis-pubsub.service";
import { PrismaService } from "../prisma/prisma.service";

@WebSocketGateway({
  namespace: "/messages",
  cors: { origin: "*" }
})
export class MessageGateway implements OnModuleInit {
  @WebSocketServer()
  server!: Server;
  private readonly socketPresence = new Map<string, string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly pubSub: RedisPubSubService,
    private readonly prisma: PrismaService
  ) {}

  onModuleInit(): void {
    this.pubSub.on("messages", (payload) => {
      const message = JSON.parse(payload) as { conversationId?: string };
      if (message.conversationId) {
        this.server.to(`conversation:${message.conversationId}`).emit("new_message", message);
      } else {
        this.server.emit("new_message", message);
      }
    });

    this.pubSub.on("messages_read", (payload) => {
      const data = JSON.parse(payload) as { conversationId?: string };
      if (data.conversationId) {
        this.server.to(`conversation:${data.conversationId}`).emit("messages_read", data);
      }
    });
  }

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret"
      });
      this.socketPresence.set(client.id, payload.sub);
      client.data.userId = payload.sub;
      this.server.emit("presence_update", {
        userId: payload.sub,
        online: true
      });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = this.socketPresence.get(client.id);
    if (!userId) return;
    this.socketPresence.delete(client.id);
    this.server.emit("presence_update", {
      userId,
      online: false
    });
  }

  @SubscribeMessage("join_conversation")
  async joinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string }
  ): Promise<{ ok: boolean }> {
    if (!await this.isParticipant(client, payload.conversationId)) return { ok: false };
    await client.join(`conversation:${payload.conversationId}`);
    return { ok: true };
  }

  @SubscribeMessage("typing")
  async typing(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; isTyping: boolean }
  ): Promise<{ ok: boolean }> {
    if (!await this.isParticipant(client, payload.conversationId)) return { ok: false };
    const userId = this.socketPresence.get(client.id);
    if (!userId) {
      return { ok: true };
    }
    this.server.to(`conversation:${payload.conversationId}`).emit("typing", {
      conversationId: payload.conversationId,
      userId,
      isTyping: payload.isTyping
    });
    return { ok: true };
  }

  async emitNewMessage(payload: Record<string, unknown>): Promise<void> {
    await this.pubSub.publish("messages", JSON.stringify(payload));
  }

  async emitMessagesRead(payload: Record<string, unknown>): Promise<void> {
    await this.pubSub.publish("messages_read", JSON.stringify(payload));
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === "string" && authToken.length > 0) {
      return authToken.replace(/^Bearer\s+/i, "");
    }
    const header = client.handshake.headers.authorization;
    if (typeof header === "string") {
      return header.replace(/^Bearer\s+/i, "");
    }
    return null;
  }

  private async isParticipant(client: Socket, conversationId: string): Promise<boolean> {
    const userId = client.data.userId;
    if (!userId || !/^[0-9a-f-]{36}$/i.test(conversationId ?? "")) return false;
    return Boolean(await this.prisma.conversationParticipant.findUnique({ where: { conversationId_userId: { conversationId, userId } } }));
  }
}
