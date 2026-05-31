import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User, UserRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

export interface AccessTokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(payload: LoginDto): Promise<AccessTokenPayload> {
    const user = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // MVP: plain compare for scaffold data. Replace with bcrypt in production.
    if (user.passwordHash !== payload.password) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.issueTokens(user);
  }

  async register(payload: RegisterDto): Promise<AccessTokenPayload> {
    const existing = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      throw new UnauthorizedException("Email already registered");
    }
    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        passwordHash: payload.password,
        role: payload.role ?? UserRole.CANDIDATE,
        isVerified: true,
        profile: {
          create: {
            fullName: payload.fullName,
            headline: payload.role === UserRole.RECRUITER ? "Recruiter" : "Open to work",
            profileCompleteness: 45
          }
        }
      }
    });
    return this.issueTokens(user);
  }

  async demoLogin(email: string): Promise<AccessTokenPayload> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<AccessTokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? "dev_refresh_secret"
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.deletedAt) {
        throw new UnauthorizedException("Invalid refresh token");
      }
      return this.issueTokens(user);
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }
  }

  logout(): { message: string } {
    return { message: "Logged out" };
  }

  private async issueTokens(user: User): Promise<AccessTokenPayload> {
    const accessExpires = process.env.JWT_ACCESS_EXPIRES_IN ?? "15m";
    const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN ?? "30d";

    const basePayload = {
      sub: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = await this.jwtService.signAsync(basePayload, {
      secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
      expiresIn: accessExpires
    });
    const refreshToken = await this.jwtService.signAsync(basePayload, {
      secret: process.env.JWT_REFRESH_SECRET ?? "dev_refresh_secret",
      expiresIn: refreshExpires
    });

    return { accessToken, refreshToken, expiresIn: accessExpires };
  }
}
