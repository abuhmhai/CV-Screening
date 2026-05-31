import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import { createHash } from "crypto";

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly redis: Redis | null;
  private readonly memory = new Map<string, { value: string; expiresAt: number }>();
  private redisAvailable = true;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.redis = null;
      this.redisAvailable = false;
      return;
    }

    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null
    });

    this.redis.on("error", () => {
      this.redisAvailable = false;
    });

    void this.redis.connect().catch(() => {
      this.redisAvailable = false;
      this.logger.warn("Redis cache unavailable — using in-memory fallback");
    });
  }

  static hashKey(parts: string[]): string {
    return createHash("sha256").update(parts.join(":")).digest("hex").slice(0, 24);
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis && this.redisAvailable) {
      try {
        const raw = await this.redis.get(key);
        if (raw) return JSON.parse(raw) as T;
      } catch {
        this.redisAvailable = false;
      }
    }

    const entry = this.memory.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.memory.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(value);
    const expiresAt = Date.now() + ttlSeconds * 1000;

    if (this.redis && this.redisAvailable) {
      try {
        await this.redis.set(key, serialized, "EX", ttlSeconds);
        return;
      } catch {
        this.redisAvailable = false;
      }
    }

    this.memory.set(key, { value: serialized, expiresAt });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
    }
  }
}
