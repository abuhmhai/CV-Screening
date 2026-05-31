import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../common/auth/jwt-auth.guard";
import { RequestUser } from "../common/auth/request-user.type";
import { requireUser } from "../common/auth/require-user";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { CreateConnectionDto } from "./dto/create-connection.dto";
import { CreatePostDto } from "./dto/create-post.dto";
import { ReactPostDto } from "./dto/react-post.dto";
import { UpdateConnectionStatusDto } from "./dto/update-connection-status.dto";
import { SocialService } from "./social.service";

@Controller("social")
@UseGuards(JwtAuthGuard)
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post("posts")
  createPost(@CurrentUser() user: RequestUser | undefined, @Body() payload: CreatePostDto) {
    const currentUser = requireUser(user);
    return this.socialService.createPost(currentUser.id, payload);
  }

  @Post("posts/:postId/comments")
  createComment(
    @CurrentUser() user: RequestUser | undefined,
    @Param("postId") postId: string,
    @Body() payload: CreateCommentDto
  ) {
    const currentUser = requireUser(user);
    return this.socialService.createComment(currentUser.id, postId, payload);
  }

  @Post("posts/:postId/reactions")
  reactToPost(
    @CurrentUser() user: RequestUser | undefined,
    @Param("postId") postId: string,
    @Body() payload: ReactPostDto
  ) {
    const currentUser = requireUser(user);
    return this.socialService.reactToPost(currentUser.id, postId, payload.reactionType);
  }

  @Post("connections")
  createConnection(@CurrentUser() user: RequestUser | undefined, @Body() payload: CreateConnectionDto) {
    const currentUser = requireUser(user);
    return this.socialService.createConnection(currentUser.id, payload);
  }

  @Get("connections")
  listConnections(@CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.socialService.listConnections(currentUser.id);
  }

  @Patch("connections/:id/status")
  updateConnectionStatus(
    @CurrentUser() user: RequestUser | undefined,
    @Param("id") connectionId: string,
    @Body() payload: UpdateConnectionStatusDto
  ) {
    const currentUser = requireUser(user);
    return this.socialService.updateConnectionStatus(currentUser.id, connectionId, payload.status);
  }

  @Get("connections/suggestions")
  getSuggestions(@CurrentUser() user: RequestUser | undefined) {
    const currentUser = requireUser(user);
    return this.socialService.suggestConnections(currentUser.id);
  }
}
