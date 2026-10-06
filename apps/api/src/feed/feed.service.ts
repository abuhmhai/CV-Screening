import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { visiblePosts } from "../social/post-access";

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async loadFeed(userId?: string, cursor?: string, limit = 20, authorId?: string) {
    const posts = await this.prisma.post.findMany({
      where: {
        ...visiblePosts(userId),
        ...(authorId ? { authorId } : {})
      },
      include: {
        author: { select: { id: true, profile: true } },
        company: true,
        comments: {
          where: { deletedAt: null },
          include: { author: { select: { id: true, profile: true } } },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: Math.min(50, Math.max(1, limit))
    });

    const now = Date.now();
    const reactions = userId ? await this.prisma.reaction.findMany({
      where: { userId, OR: [
        { targetType: "POST", targetId: { in: posts.map(p => p.id) } },
        { targetType: "COMMENT", targetId: { in: posts.flatMap(p => p.comments.map(c => c.id)) } }
      ] }
    }) : [];
    return posts
      .map((post) => {
        const ageHours = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
        const freshness = Math.max(0, 72 - ageHours) / 72;
        const engagementScore = post.likeCount * 1.4 + post.commentCount * 2;
        const score = Number((freshness * 50 + engagementScore).toFixed(2));
        return {
          ...post,
          userReaction: reactions.find(r => r.targetType === "POST" && r.targetId === post.id)?.reactionType ?? null,
          comments: post.comments.map(c => ({ ...c, userReaction: reactions.find(r => r.targetType === "COMMENT" && r.targetId === c.id)?.reactionType ?? null })),
          feedScore: score
        };
      });
  }
}
