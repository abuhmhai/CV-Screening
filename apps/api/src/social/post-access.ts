import { Prisma } from "@prisma/client";

export function visiblePosts(userId?: string): Prisma.PostWhereInput {
  return {
    deletedAt: null,
    author: { deletedAt: null },
    OR: [
      { visibility: "PUBLIC" },
      ...(userId ? [
        { authorId: userId },
        { visibility: "CONNECTIONS" as const, author: { OR: [
          { requestedConnections: { some: { addresseeId: userId, status: "ACCEPTED" as const } } },
          { addressedConnections: { some: { requesterId: userId, status: "ACCEPTED" as const } } }
        ] } }
      ] : [])
    ]
  };
}
