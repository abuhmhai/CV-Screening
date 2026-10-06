import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { visiblePosts } from "./post-access";
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
    await this.requirePost(authorId, postId);
    if (!payload.content.trim()) throw new BadRequestException("Bình luận không được để trống");
    if (payload.parentId) {
      const parent = await this.prisma.comment.findFirst({ where: { id: payload.parentId, postId, deletedAt: null } });
      if (!parent) throw new BadRequestException("Bình luận gốc không tồn tại");
    }
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
    await this.requirePost(userId, postId);
    const existing = await this.prisma.reaction.findUnique({
      where: {
        userId_targetType_targetId: {
          userId,
          targetType: ReactionTargetType.POST,
          targetId: postId
        }
      }
    });

    if (existing && existing.reactionType === reactionType) {
      // Toggle off / remove reaction
      await this.prisma.reaction.delete({
        where: {
          userId_targetType_targetId: {
            userId,
            targetType: ReactionTargetType.POST,
            targetId: postId
          }
        }
      });
      const totalReactions = await this.prisma.reaction.count({
        where: {
          targetType: ReactionTargetType.POST,
          targetId: postId
        }
      });
      const updatedPost = await this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: totalReactions }
      });
      return { ...updatedPost, userReaction: null, removed: true };
    }

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

    const updatedPost = await this.prisma.post.update({
      where: { id: postId },
      data: { likeCount: totalReactions }
    });
    return { ...updatedPost, userReaction: reactionType, removed: false };
  }

  async createConnection(requesterId: string, payload: CreateConnectionDto) {
    if (requesterId === payload.addresseeId) {
      throw new ForbiddenException("Cannot connect to yourself");
    }
    const connection = await this.prisma.connection.create({
      data: {
        requesterId,
        addresseeId: payload.addresseeId,
        status: ConnectionStatus.PENDING
      },
      include: {
        requester: { include: { profile: true } }
      }
    });

    try {
      const requesterName =
        connection.requester?.profile?.fullName ||
        connection.requester?.email?.split("@")[0] ||
        "Một người dùng";
      await this.prisma.notification.create({
        data: {
          userId: payload.addresseeId,
          type: "CONNECTION_REQUEST",
          title: "Lời mời kết nối mới",
          body: `${requesterName} đã gửi cho bạn một lời mời kết nối.`,
          data: {
            connectionId: connection.id,
            requesterId,
            url: "/network"
          }
        }
      });
    } catch {
      // Ignore notification failure to not block connection creation
    }

    return connection;
  }

  async requirePost(userId: string, postId: string) {
    const post = await this.prisma.post.findFirst({ where: { id: postId, ...visiblePosts(userId) } });
    if (!post) throw new NotFoundException("Bài viết không tồn tại hoặc bạn không có quyền xem");
    return post;
  }

  async reactToComment(userId: string, commentId: string, reactionType: ReactionType = ReactionType.LIKE) {
    const comment = await this.prisma.comment.findFirst({ where: { id: commentId, deletedAt: null } });
    if (!comment) throw new NotFoundException("Bình luận không tồn tại");
    await this.requirePost(userId, comment.postId);
    const key = { userId, targetType: ReactionTargetType.COMMENT, targetId: commentId };
    const existing = await this.prisma.reaction.findUnique({ where: { userId_targetType_targetId: key } });
    if (existing?.reactionType === reactionType) {
      await this.prisma.reaction.delete({ where: { userId_targetType_targetId: key } });
      return { userReaction: null };
    }
    await this.prisma.reaction.upsert({ where: { userId_targetType_targetId: key }, create: { ...key, reactionType }, update: { reactionType } });
    return { userReaction: reactionType };
  }

  async followStatus(userId: string, followedId: string) {
    const [follow, count] = await Promise.all([
      this.prisma.userFollow.findUnique({ where: { followerId_followedId: { followerId: userId, followedId } } }),
      this.prisma.userFollow.count({ where: { followedId } })
    ]);
    return { following: Boolean(follow), followerCount: count };
  }

  async follow(userId: string, followedId: string) {
    if (userId === followedId) throw new BadRequestException("Không thể theo dõi chính mình");
    const target = await this.prisma.user.findFirst({ where: { id: followedId, deletedAt: null } });
    if (!target) throw new NotFoundException("Người dùng không tồn tại");
    await this.prisma.userFollow.upsert({ where: { followerId_followedId: { followerId: userId, followedId } }, create: { followerId: userId, followedId }, update: {} });
    return this.followStatus(userId, followedId);
  }

  async unfollow(userId: string, followedId: string) {
    await this.prisma.userFollow.deleteMany({ where: { followerId: userId, followedId } });
    return this.followStatus(userId, followedId);
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
      where: { id: connectionId },
      include: {
        addressee: { include: { profile: true } },
        requester: { include: { profile: true } }
      }
    });
    if (!existing) {
      throw new ForbiddenException("Connection request not found");
    }
    if (existing.requesterId !== userId && existing.addresseeId !== userId) {
      throw new ForbiddenException("Not allowed to update this connection");
    }
    if (status === ConnectionStatus.ACCEPTED && existing.addresseeId !== userId) {
      throw new ForbiddenException("Chỉ người nhận mới có thể chấp nhận lời mời kết bạn");
    }

    const updated = await this.prisma.connection.update({
      where: { id: connectionId },
      data: { status }
    });

    if (status === ConnectionStatus.ACCEPTED) {
      try {
        const accepter = existing.addresseeId === userId ? existing.addressee : existing.requester;
        const targetUserId =
          existing.addresseeId === userId ? existing.requesterId : existing.addresseeId;
        const accepterName =
          accepter?.profile?.fullName || accepter?.email?.split("@")[0] || "Người dùng";
        await this.prisma.notification.create({
          data: {
            userId: targetUserId,
            type: "CONNECTION_ACCEPTED",
            title: "Kết nối thành công",
            body: `${accepterName} đã chấp nhận lời mời kết nối của bạn.`,
            data: {
              connectionId,
              url: "/network"
            }
          }
        });
      } catch {
        // Ignore notification failure
      }
    }

    return updated;
  }

  async removeConnection(userId: string, connectionId: string) {
    const existing = await this.prisma.connection.findUnique({
      where: { id: connectionId }
    });
    if (!existing) {
      throw new ForbiddenException("Connection not found");
    }
    if (existing.requesterId !== userId && existing.addresseeId !== userId) {
      throw new ForbiddenException("Not allowed to remove this connection");
    }
    return this.prisma.connection.delete({
      where: { id: connectionId }
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
