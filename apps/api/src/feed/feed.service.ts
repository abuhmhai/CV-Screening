import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async loadFeed(userId: string, cursor?: string, limit = 20) {
    const acceptedConnections = await this.prisma.connection.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { addresseeId: userId }]
      },
      select: { requesterId: true, addresseeId: true }
    });

    const authorIds = new Set<string>([userId]);
    for (const item of acceptedConnections) {
      authorIds.add(item.requesterId);
      authorIds.add(item.addresseeId);
    }

    const posts = await this.prisma.post.findMany({
      where: {
        deletedAt: null,
        authorId: { in: Array.from(authorIds) }
      },
      include: {
        author: { include: { profile: true } },
        company: true,
        comments: {
          where: { deletedAt: null },
          include: { author: { include: { profile: true } } },
          take: 3,
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: limit
    });

    const now = Date.now();
    return posts
      .map((post) => {
        const ageHours = (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
        const freshness = Math.max(0, 72 - ageHours) / 72;
        const engagementScore = post.likeCount * 1.4 + post.commentCount * 2;
        const score = Number((freshness * 50 + engagementScore).toFixed(2));
        return {
          ...post,
          feedScore: score
        };
      })
      .sort((a, b) => b.feedScore - a.feedScore);
  }
}
