import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { RequestUser } from "./request-user.type";

interface JwtPayload {
  sub: string;
  email: string;
  role?: RequestUser["role"];
  user_metadata?: {
    role?: RequestUser["role"];
    email?: string;
  };
}

type RequestWithUser = Request & { user?: RequestUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret"
      });
      request.user = { id: payload.sub, email: payload.email, role: payload.role ?? "CANDIDATE" };
      return true;
    } catch {
      // Fallback: Check for Supabase Auth token (decode claims)
      try {
        const decoded = this.jwtService.decode(token) as JwtPayload | null;
        if (decoded && decoded.sub) {
          const email = decoded.email || decoded.user_metadata?.email || `user-${decoded.sub.slice(0, 8)}@supabase.local`;
          const rawRole = decoded.user_metadata?.role || decoded.role;
          const role: RequestUser["role"] =
            rawRole === "RECRUITER" || rawRole === "ADMIN" ? rawRole : "CANDIDATE";
          request.user = { id: decoded.sub, email, role };
          return true;
        }
      } catch {
        // Both validations failed
      }
      throw new UnauthorizedException("Invalid token");
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const [type, token] = authHeader.split(" ");
    if (type !== "Bearer" || !token) {
      return null;
    }
    return token;
  }
}
