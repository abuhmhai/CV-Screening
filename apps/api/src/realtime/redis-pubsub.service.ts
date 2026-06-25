import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

type ChannelName = "notifications" | "messages" | "messages_read";
type Handler = (payload: string) => void;

@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private readonly publisher: Redis | null;
  private readonly subscriber: Redis | null;
  private readonly handlers: Record<ChannelName, Handler[]> = {
    notifications: [],
    messages: [],
    messages_read: []
  };
  private redisAvailable = true;

  constructor() {
    const redisUrl = process.env.REDIS_URL ?? "redis://localhost:6379/0";
    this.publisher = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null
    });
    this.subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null
    });

    const disableRedis = () => {
      if (this.redisAvailable) {
        this.redisAvailable = false;
        this.logger.warn("Redis pub/sub unavailable — falling back to in-process events");
      }
    };
    this.publisher.on("error", disableRedis);
    this.subscriber.on("error", disableRedis);

    void Promise.all([this.publisher.connect(), this.subscriber.connect()])
      .then(async () => {
        await this.subscriber?.subscribe("notifications", "messages", "messages_read");
        this.subscriber?.on("message", (channel, payload) => {
          if (channel === "notifications" || channel === "messages" || channel === "messages_read") {
            for (const handler of this.handlers[channel as ChannelName]) {
              handler(payload);
            }
          }
        });
      })
      .catch(() => {
        disableRedis();
      });
  }

  private emitLocal(channel: ChannelName, payload: string): void {
    for (const handler of this.handlers[channel]) {
      handler(payload);
    }
  }

  on(channel: ChannelName, handler: Handler): void {
    if (!this.handlers[channel]) {
      this.handlers[channel] = [];
    }
    this.handlers[channel].push(handler);
  }

  async publish(channel: ChannelName, payload: string): Promise<void> {
    if (!this.redisAvailable || !this.publisher) {
      this.emitLocal(channel, payload);
      return;
    }
    try {
      await this.publisher.publish(channel, payload);
    } catch {
      this.redisAvailable = false;
      this.emitLocal(channel, payload);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([
      this.publisher?.quit().catch(() => undefined),
      this.subscriber?.quit().catch(() => undefined)
    ]);
  }
}
