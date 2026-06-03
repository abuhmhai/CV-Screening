import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

export interface AccessTokenPayload {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

const BCRYPT_ROUNDS = 10;

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

    const valid = await this.verifyPassword(payload.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Transparently upgrade legacy plain-text passwords to bcrypt on login.
    if (!this.isBcryptHash(user.passwordHash)) {
      const hashed = await bcrypt.hash(payload.password, BCRYPT_ROUNDS);
      await this.prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashed } });
    }

    return this.issueTokens(user);
  }

  async register(payload: RegisterDto): Promise<AccessTokenPayload> {
    const existing = await this.prisma.user.findUnique({ where: { email: payload.email } });
    if (existing) {
      throw new UnauthorizedException("Email already registered");
    }
    const passwordHash = await bcrypt.hash(payload.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: payload.email,
        passwordHash,
        role: payload.role ?? UserRole.CANDIDATE,
        isVerified: false,
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

  /**
   * Issues a short-lived email-verification token. In production this would be
   * emailed as a link; here we also return it so the flow is testable.
   */
  async requestEmailVerification(userId: string): Promise<{ token: string }> {
    const token = await this.jwtService.signAsync(
      { sub: userId, purpose: "email_verification" },
      { secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret", expiresIn: "1d" }
    );
    return { token };
  }

  async verifyEmail(token: string): Promise<{ verified: boolean }> {
    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; purpose: string }>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret"
      });
      if (payload.purpose !== "email_verification") {
        throw new BadRequestException("Invalid verification token");
      }
      await this.prisma.user.update({ where: { id: payload.sub }, data: { isVerified: true } });
      return { verified: true };
    } catch {
      throw new BadRequestException("Invalid or expired verification token");
    }
  }

  private async verifyPassword(plain: string, stored: string): Promise<boolean> {
    if (this.isBcryptHash(stored)) {
      return bcrypt.compare(plain, stored);
    }
    // Legacy seed data stored plain text.
    return plain === stored;
  }

  private isBcryptHash(value: string): boolean {
    return /^\$2[aby]\$/.test(value);
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

  // ─── OAuth (Google / LinkedIn) ───────────────────────────────────────────────

  getOAuthRedirectUrl(provider: "google" | "linkedin"): { url: string } {
    if (provider === "google") {
      const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
      const redirectUri = process.env.GOOGLE_OAUTH_CALLBACK_URL;
      this.assertConfigured(clientId, redirectUri, "Google");
      const params = new URLSearchParams({
        client_id: clientId!,
        redirect_uri: redirectUri!,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent"
      });
      return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` };
    }

    const clientId = process.env.LINKEDIN_OAUTH_CLIENT_ID;
    const redirectUri = process.env.LINKEDIN_OAUTH_CALLBACK_URL;
    this.assertConfigured(clientId, redirectUri, "LinkedIn");
    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri!,
      response_type: "code",
      scope: "r_liteprofile r_emailaddress"
    });
    return { url: `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}` };
  }

  async handleOAuthCallback(
    provider: "google" | "linkedin",
    code: string
  ): Promise<AccessTokenPayload> {
    const profile =
      provider === "google"
        ? await this.exchangeGoogle(code)
        : await this.exchangeLinkedin(code);

    if (!profile.email) {
      throw new UnauthorizedException("OAuth provider did not return an email");
    }

    let user = await this.prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      const randomSecret = await bcrypt.hash(`${provider}:${profile.email}:${Date.now()}`, BCRYPT_ROUNDS);
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          passwordHash: randomSecret,
          role: UserRole.CANDIDATE,
          isVerified: true,
          profile: {
            create: {
              fullName: profile.name ?? profile.email.split("@")[0],
              avatarUrl: profile.avatarUrl,
              headline: "Open to work",
              profileCompleteness: 40
            }
          }
        }
      });
    }

    return this.issueTokens(user);
  }

  private assertConfigured(clientId?: string, redirectUri?: string, name = "OAuth") {
    if (!clientId || clientId.startsWith("replace") || !redirectUri) {
      throw new BadRequestException(`${name} OAuth is not configured`);
    }
  }

  private async exchangeGoogle(code: string): Promise<{ email?: string; name?: string; avatarUrl?: string }> {
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "",
        redirect_uri: process.env.GOOGLE_OAUTH_CALLBACK_URL ?? "",
        grant_type: "authorization_code"
      })
    });
    if (!tokenResp.ok) {
      throw new UnauthorizedException("Google token exchange failed");
    }
    const tokenJson = (await tokenResp.json()) as { access_token?: string };
    const userResp = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    if (!userResp.ok) {
      throw new UnauthorizedException("Google userinfo request failed");
    }
    const info = (await userResp.json()) as { email?: string; name?: string; picture?: string };
    return { email: info.email, name: info.name, avatarUrl: info.picture };
  }

  private async exchangeLinkedin(code: string): Promise<{ email?: string; name?: string; avatarUrl?: string }> {
    const tokenResp = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.LINKEDIN_OAUTH_CLIENT_ID ?? "",
        client_secret: process.env.LINKEDIN_OAUTH_CLIENT_SECRET ?? "",
        redirect_uri: process.env.LINKEDIN_OAUTH_CALLBACK_URL ?? "",
        grant_type: "authorization_code"
      })
    });
    if (!tokenResp.ok) {
      throw new UnauthorizedException("LinkedIn token exchange failed");
    }
    const tokenJson = (await tokenResp.json()) as { access_token?: string };
    const meResp = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenJson.access_token}` }
    });
    if (!meResp.ok) {
      throw new UnauthorizedException("LinkedIn userinfo request failed");
    }
    const info = (await meResp.json()) as { email?: string; name?: string; picture?: string };
    return { email: info.email, name: info.name, avatarUrl: info.picture };
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
