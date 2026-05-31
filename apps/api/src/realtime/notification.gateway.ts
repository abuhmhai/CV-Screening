import { Injectable, OnModuleInit } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { RedisPubSubService } from "./redis-pubsub.service";

interface NotificationEvent {
  userId: string;
  type: string;
  payload: Record<string, unknown>;
}

@Injectable()
@WebSocketGateway({
  namespace: "/notifications",
  cors: { origin: "*" }
})
export class NotificationGateway implements OnModuleInit {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly pubSub: RedisPubSubService
  ) {}

  onModuleInit(): void {
    this.pubSub.on("notifications", (payload) => {
      const event = JSON.parse(payload) as NotificationEvent;
      this.server.to(`user:${event.userId}`).emit("notification", event);
      if (event.type === "application_status_changed") {
        this.server.to(`user:${event.userId}`).emit("application_status_changed", event.payload);
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
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  async notify(event: NotificationEvent): Promise<void> {
    await this.pubSub.publish("notifications", JSON.stringify(event));
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
}
