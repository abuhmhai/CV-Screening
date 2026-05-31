import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger
} from "@nestjs/common";
import { Request, Response } from "express";
import Redis from "ioredis";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly redis: Redis | null;
  private readonly memory = new Map<string, RateLimitEntry>();
  private redisAvailable = true;

  private readonly windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? "60000");
  private readonly maxRequests = Number(process.env.RATE_LIMIT_MAX ?? "120");

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
      this.logger.warn("Redis rate-limit unavailable — using in-memory fallback");
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    if (req.path.endsWith("/health") || req.path.endsWith("/metrics")) {
      return true;
    }

    const key = this.buildKey(req);
    const { count, resetAt } = await this.increment(key);

    const remaining = Math.max(0, this.maxRequests - count);
    res.setHeader("X-RateLimit-Limit", String(this.maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

    if (count > this.maxRequests) {
      throw new HttpException(
        { message: "Too many requests", retryAfterMs: resetAt - Date.now() },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  private buildKey(req: Request): string {
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const userId = (req as Request & { user?: { id?: string } }).user?.id;
    return userId ? `rl:user:${userId}` : `rl:ip:${ip}`;
  }

  private async increment(key: string): Promise<{ count: number; resetAt: number }> {
    const windowSec = Math.ceil(this.windowMs / 1000);

    if (this.redis && this.redisAvailable) {
      try {
        const count = await this.redis.incr(key);
        if (count === 1) {
          await this.redis.expire(key, windowSec);
        }
        const ttl = await this.redis.pttl(key);
        return { count, resetAt: Date.now() + (ttl > 0 ? ttl : this.windowMs) };
      } catch {
        this.redisAvailable = false;
      }
    }

    const now = Date.now();
    const entry = this.memory.get(key);
    if (!entry || now > entry.resetAt) {
      const fresh = { count: 1, resetAt: now + this.windowMs };
      this.memory.set(key, fresh);
      return fresh;
    }

    entry.count += 1;
    this.memory.set(key, entry);
    return entry;
  }
}
