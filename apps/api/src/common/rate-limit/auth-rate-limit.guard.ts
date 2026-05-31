import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable
} from "@nestjs/common";
import { Request, Response } from "express";

interface AuthRateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly memory = new Map<string, AuthRateLimitEntry>();
  private readonly windowMs = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? "60000");
  private readonly maxRequests = Number(process.env.AUTH_RATE_LIMIT_MAX ?? "20");

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
    const key = `auth:ip:${ip}`;

    const now = Date.now();
    const entry = this.memory.get(key);
    let count = 1;
    let resetAt = now + this.windowMs;

    if (entry && now <= entry.resetAt) {
      count = entry.count + 1;
      resetAt = entry.resetAt;
    }

    this.memory.set(key, { count, resetAt });

    const remaining = Math.max(0, this.maxRequests - count);
    res.setHeader("X-RateLimit-Limit", String(this.maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));

    if (count > this.maxRequests) {
      throw new HttpException(
        { message: "Too many auth attempts", retryAfterMs: resetAt - now },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }
}
