import { ForbiddenException, Injectable } from "@nestjs/common";
import { ConnectionStatus, PostVisibility, ReactionTargetType, ReactionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { CreateConnectionDto } from "./dto/create-connection.dto";
import { CreatePostDto } from "./dto/create-post.dto";

@Injectable()
export class SocialService {
  constructor(private readonly prisma: PrismaService) {}

  createPost(authorId: string, payload: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        authorId,
        companyId: payload.companyId,
        content: payload.content,
        mediaUrls: payload.mediaUrls ?? [],
        visibility: payload.visibility ?? PostVisibility.PUBLIC
      },
      include: {
        author: { include: { profile: true } },
        company: true
      }
    });
  }

  async createComment(authorId: string, postId: string, payload: CreateCommentDto) {
    const comment = await this.prisma.comment.create({
      data: {
        postId,
        authorId,
        parentId: payload.parentId,
        content: payload.content
      },
      include: {
        author: { include: { profile: true } }
      }
    });

    await this.prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } }
    });

    return comment;
  }

  async reactToPost(userId: string, postId: string, reactionType: ReactionType = ReactionType.LIKE) {
    await this.prisma.reaction.upsert({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: ReactionTargetType.POST,
          targetId: postId
        }
      },
      create: {
        userId,
        targetType: ReactionTargetType.POST,
        targetId: postId,
        reactionType
      },
      update: { reactionType }
    });

    const totalReactions = await this.prisma.reaction.count({
      where: {
        targetType: ReactionTargetType.POST,
        targetId: postId
      }
    });

    return this.prisma.post.update({
      where: { id: postId },
      data: { likeCount: totalReactions }
    });
  }

  createConnection(requesterId: string, payload: CreateConnectionDto) {
    if (requesterId === payload.addresseeId) {
      throw new ForbiddenException("Cannot connect to yourself");
    }
    return this.prisma.connection.create({
      data: {
        requesterId,
        addresseeId: payload.addresseeId,
        status: ConnectionStatus.PENDING
      }
    });
  }

  listConnections(userId: string) {
    return this.prisma.connection.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }]
      },
      include: {
        requester: { include: { profile: true } },
        addressee: { include: { profile: true } }
      },
      orderBy: { id: "desc" }
    });
  }

  async updateConnectionStatus(
    userId: string,
    connectionId: string,
    status: ConnectionStatus
  ) {
    const existing = await this.prisma.connection.findUnique({
      where: { id: connectionId }
    });
    if (!existing) {
      throw new ForbiddenException("Connection request not found");
    }
    if (existing.requesterId !== userId && existing.addresseeId !== userId) {
      throw new ForbiddenException("Not allowed to update this connection");
    }

    return this.prisma.connection.update({
      where: { id: connectionId },
      data: { status }
    });
  }

  async suggestConnections(userId: string) {
    const existingConnections = await this.prisma.connection.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }]
      },
      select: { requesterId: true, addresseeId: true }
    });

    const connectedIds = new Set<string>([userId]);
    for (const item of existingConnections) {
      connectedIds.add(item.requesterId);
      connectedIds.add(item.addresseeId);
    }

    return this.prisma.user.findMany({
      where: {
        id: { notIn: Array.from(connectedIds) },
        deletedAt: null
      },
      include: {
        profile: true
      },
      take: 10,
      orderBy: { createdAt: "desc" }
    });
  }
}
