import { UnauthorizedException } from "@nestjs/common";
import { RequestUser } from "./request-user.type";

export function requireUser(user: RequestUser | undefined): RequestUser {
  if (!user) {
    throw new UnauthorizedException("Authenticated user not found in request");
  }
  return user;
}
