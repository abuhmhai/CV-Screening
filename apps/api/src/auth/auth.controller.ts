import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { AuthRateLimitGuard } from "../common/rate-limit/auth-rate-limit.guard";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { RequestUser } from "../common/auth/request-user.type";
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
}
