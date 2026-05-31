import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { RequestUser } from "./request-user.type";

type RequestWithUser = Request & { user?: RequestUser };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  }
);
