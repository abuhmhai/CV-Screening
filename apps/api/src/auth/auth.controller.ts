import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { AuthRateLimitGuard } from "../common/rate-limit/auth-rate-limit.guard";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";

@UseGuards(AuthRateLimitGuard)
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Post("register")
  register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @Post("refresh")
  refresh(@Body() payload: RefreshTokenDto) {
    return this.authService.refresh(payload.refreshToken);
  }

  @Post("logout")
  logout() {
    return this.authService.logout();
  }

  @Get("demo-login")
  demoLogin(@Query("email") email: string) {
    return this.authService.demoLogin(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: RequestUser | undefined) {
    return { user };
  }

  @UseGuards(JwtAuthGuard)
  @Post("request-verification")
  requestVerification(@CurrentUser() user: RequestUser | undefined) {
    return this.authService.requestEmailVerification(requireUser(user).id);
  }

  @Post("verify-email")
  verifyEmail(@Body("token") token: string) {
    return this.authService.verifyEmail(token);
  }

  @Get(":provider")
  oauthStart(@Param("provider") provider: string) {
    return this.authService.getOAuthRedirectUrl(this.normalizeProvider(provider));
  }

  @Get(":provider/callback")
  async oauthCallback(
    @Param("provider") provider: string,
    @Query("code") code: string,
    @Res() res: Response
  ) {
    const tokens = await this.authService.handleOAuthCallback(this.normalizeProvider(provider), code);
    const webUrl = process.env.WEB_APP_URL ?? "http://localhost:3000";
    res.redirect(`${webUrl}/auth/oauth-callback?accessToken=${tokens.accessToken}`);
  }

  private normalizeProvider(provider: string): "google" | "linkedin" {
    if (provider !== "google" && provider !== "linkedin") {
      throw new Error("Unsupported OAuth provider");
    }
    return provider;
  }
}
